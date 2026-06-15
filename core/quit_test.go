package core

import "testing"

type fakeQuitWindow struct {
	id      uint
	events  []string
	focused int
	closed  int
}

func (w *fakeQuitWindow) ID() uint {
	return w.id
}

func (w *fakeQuitWindow) EmitEvent(name string, _ ...any) bool {
	w.events = append(w.events, name)
	return true
}

func (w *fakeQuitWindow) Focus() {
	w.focused++
}

func (w *fakeQuitWindow) Close() {
	w.closed++
}

func TestQuitCoordinatorRequestsEachWindowSequentially(t *testing.T) {
	var allowed []uint
	quitCount := 0
	coordinator := newQuitCoordinator(func(id uint) {
		allowed = append(allowed, id)
	}, func() {
		quitCount++
	})

	first := &fakeQuitWindow{id: 1}
	second := &fakeQuitWindow{id: 2}

	coordinator.Begin([]quitWindow{first, second})

	if first.focused != 1 {
		t.Fatalf("expected first window to be focused for confirmation, got %d", first.focused)
	}
	if len(first.events) != 1 || first.events[0] != quitConfirmWindowEvent {
		t.Fatalf("expected first window confirmation event, got %#v", first.events)
	}
	if len(second.events) != 0 {
		t.Fatalf("expected second window to wait, got events %#v", second.events)
	}

	coordinator.Confirm(first.ID())

	if first.closed != 1 {
		t.Fatalf("expected first window to close after confirmation, got %d", first.closed)
	}
	if len(allowed) != 1 || allowed[0] != first.ID() {
		t.Fatalf("expected first window to be allowed to close, got %#v", allowed)
	}
	if len(second.events) != 1 || second.events[0] != quitConfirmWindowEvent {
		t.Fatalf("expected second window confirmation event after first closes, got %#v", second.events)
	}
	if quitCount != 0 {
		t.Fatalf("expected app not to quit before all windows confirm, got %d quits", quitCount)
	}

	coordinator.Confirm(second.ID())

	if second.closed != 1 {
		t.Fatalf("expected second window to close after confirmation, got %d", second.closed)
	}
	if len(allowed) != 2 || allowed[1] != second.ID() {
		t.Fatalf("expected second window to be allowed to close, got %#v", allowed)
	}
	if quitCount != 1 {
		t.Fatalf("expected app to quit after all windows confirm, got %d quits", quitCount)
	}
}

func TestQuitCoordinatorCancelStopsPendingQuit(t *testing.T) {
	quitCount := 0
	coordinator := newQuitCoordinator(func(uint) {}, func() {
		quitCount++
	})
	first := &fakeQuitWindow{id: 1}
	second := &fakeQuitWindow{id: 2}

	coordinator.Begin([]quitWindow{first, second})
	coordinator.Cancel()
	coordinator.Confirm(first.ID())

	if first.closed != 0 || second.closed != 0 {
		t.Fatalf("expected no windows to close after cancel, first=%d second=%d", first.closed, second.closed)
	}
	if len(second.events) != 0 {
		t.Fatalf("expected no further confirmation events after cancel, got %#v", second.events)
	}
	if quitCount != 0 {
		t.Fatalf("expected app not to quit after cancel, got %d quits", quitCount)
	}
}

func TestQuitCoordinatorIgnoresDuplicateBeginWhileWaitingForConfirmation(t *testing.T) {
	coordinator := newQuitCoordinator(func(uint) {}, func() {})
	first := &fakeQuitWindow{id: 1}
	second := &fakeQuitWindow{id: 2}

	coordinator.Begin([]quitWindow{first, second})
	coordinator.Begin([]quitWindow{first, second})

	if first.focused != 1 {
		t.Fatalf("expected duplicate quit request not to refocus current window, got %d focuses", first.focused)
	}
	if len(first.events) != 1 {
		t.Fatalf("expected duplicate quit request not to resend confirmation, got %#v", first.events)
	}

	coordinator.Confirm(first.ID())

	if len(second.events) != 1 {
		t.Fatalf("expected original queue to continue with second window once, got %#v", second.events)
	}
}
