//go:build darwin

package core

/*
#cgo CFLAGS: -mmacosx-version-min=12.0 -x objective-c
#cgo LDFLAGS: -framework Cocoa -framework WebKit

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

@interface WebviewWindow : NSWindow
@property (assign) WKWebView* webView;
@end

@interface _WKInspector : NSObject
- (void)show;
- (void)close;
- (BOOL)isVisible;
@end

@interface WKWebView ()
- (_WKInspector *)_inspector;
@end

void toggleDevTools(void *nswin) {
    dispatch_async(dispatch_get_main_queue(), ^{
        WebviewWindow *w = (WebviewWindow *)nswin;
        _WKInspector *inspector = w.webView._inspector;
        if (inspector.isVisible) {
            [inspector close];
        } else {
            [inspector show];
        }
    });
}

void positionTrafficLights(void *nswin, double x, double y, double size) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSWindow *w = (NSWindow *)nswin;
        NSButton *buttons[3] = {
            [w standardWindowButton:NSWindowCloseButton],
            [w standardWindowButton:NSWindowMiniaturizeButton],
            [w standardWindowButton:NSWindowZoomButton],
        };
        CGFloat gap = buttons[1].frame.origin.x - buttons[0].frame.origin.x;
        CGFloat titlebarHeight = buttons[0].superview.superview.frame.size.height;
        CGFloat btnY = titlebarHeight - y - size;
        for (int i = 0; i < 3; i++) {
            [buttons[i] setFrameSize:NSMakeSize(size, size)];
            [buttons[i] setFrameOrigin:NSMakePoint(x + gap * i, btnY)];
        }
    });
}

static const char kSavedFrameKey = 0;
static const char kExpandedKey   = 0;
static const char kSetupKey      = 0;
static const char kSystemMenuCleanerKey = 0;
static const char kDeveloperToolsShortcutViewKey = 0;
static const char kCustomHelpMenuCleanerKey = 0;

@interface FastMDShortcutMenuItemView : NSView
@property (nonatomic, copy) NSString *titleText;
@property (nonatomic, copy) NSString *shortcutText;
@property (nonatomic, retain) NSImage *iconImage;
@end

@implementation FastMDShortcutMenuItemView
- (instancetype)initWithTitle:(NSString *)title shortcut:(NSString *)shortcut icon:(NSImage *)icon width:(CGFloat)width {
    self = [super initWithFrame:NSMakeRect(0, 0, width, 24)];
    if (self) {
        self.titleText = title;
        self.shortcutText = shortcut;
        self.iconImage = icon;
        self.autoresizingMask = NSViewWidthSizable;
    }
    return self;
}

- (void)dealloc {
    self.titleText = nil;
    self.shortcutText = nil;
    self.iconImage = nil;
    [super dealloc];
}

- (BOOL)isFlipped {
    return YES;
}

- (BOOL)acceptsFirstMouse:(NSEvent *)event {
    return YES;
}

- (void)mouseDown:(NSEvent *)event {
    NSMenuItem *item = self.enclosingMenuItem;
    if (!item || !item.enabled) return;

    NSMenu *menu = item.menu;
    [menu cancelTracking];
    [NSApp sendAction:item.action to:item.target from:item];
}

- (NSDictionary *)attributesWithColor:(NSColor *)color {
    NSMutableParagraphStyle *paragraph = [[[NSMutableParagraphStyle alloc] init] autorelease];
    paragraph.lineBreakMode = NSLineBreakByTruncatingTail;
    return @{
        NSFontAttributeName: [NSFont menuFontOfSize:0],
        NSForegroundColorAttributeName: color,
        NSParagraphStyleAttributeName: paragraph,
    };
}

- (void)drawRect:(NSRect)dirtyRect {
    NSMenuItem *item = self.enclosingMenuItem;
    BOOL highlighted = item && item.highlighted;
    BOOL enabled = !item || item.enabled;

    if (highlighted) {
        [[NSColor selectedContentBackgroundColor] setFill];
        NSRectFill(self.bounds);
    }

    NSColor *titleColor = highlighted ? [NSColor selectedMenuItemTextColor] : (enabled ? [NSColor labelColor] : [NSColor disabledControlTextColor]);
    NSColor *shortcutColor = highlighted ? [NSColor selectedMenuItemTextColor] : (enabled ? [NSColor tertiaryLabelColor] : [NSColor disabledControlTextColor]);
    NSDictionary *titleAttrs = [self attributesWithColor:titleColor];
    NSDictionary *shortcutAttrs = [self attributesWithColor:shortcutColor];

    CGFloat iconSize = 16;
    CGFloat iconX = 14;
    CGFloat textX = 38;
    CGFloat rightPadding = 18;
    CGFloat gap = 28;

    if (self.iconImage) {
        NSRect iconRect = NSMakeRect(iconX, floor((NSHeight(self.bounds) - iconSize) / 2), iconSize, iconSize);
        [self.iconImage drawInRect:iconRect fromRect:NSZeroRect operation:NSCompositingOperationSourceOver fraction:enabled ? 1.0 : 0.45];
    }

    NSSize shortcutSize = [self.shortcutText sizeWithAttributes:shortcutAttrs];
    CGFloat shortcutX = NSWidth(self.bounds) - rightPadding - shortcutSize.width;
    CGFloat shortcutY = floor((NSHeight(self.bounds) - shortcutSize.height) / 2);
    [self.shortcutText drawAtPoint:NSMakePoint(shortcutX, shortcutY) withAttributes:shortcutAttrs];

    CGFloat titleWidth = MAX(20, shortcutX - textX - gap);
    NSSize titleSize = [self.titleText sizeWithAttributes:titleAttrs];
    CGFloat titleY = floor((NSHeight(self.bounds) - titleSize.height) / 2);
    [self.titleText drawInRect:NSMakeRect(textX, titleY, titleWidth, titleSize.height) withAttributes:titleAttrs];
}
@end

static void removeSystemHelpItemsFromMenu(NSMenu *menu) {
    NSArray<NSMenuItem *> *items = [menu.itemArray copy];
    for (NSMenuItem *item in items) {
        if (item.view || item.action == @selector(orderFrontStandardAboutPanel:) || [item.title hasPrefix:@"About "] || [item.title hasPrefix:@"关于"]) {
            [menu removeItem:item];
        }
    }
    [items release];
}

@interface FastMDCustomHelpMenuCleaner : NSObject <NSMenuDelegate>
@end

@implementation FastMDCustomHelpMenuCleaner
- (void)menuNeedsUpdate:(NSMenu *)menu {
    removeSystemHelpItemsFromMenu(menu);
}

- (void)menuWillOpen:(NSMenu *)menu {
    removeSystemHelpItemsFromMenu(menu);
}
@end

static NSString *compactSystemMenuTitle(NSString *title) {
    NSString *compactTitle = [[title ?: @"" lowercaseString] stringByReplacingOccurrencesOfString:@" " withString:@""];
    compactTitle = [compactTitle stringByReplacingOccurrencesOfString:@"-" withString:@""];
    compactTitle = [compactTitle stringByReplacingOccurrencesOfString:@"_" withString:@""];
    return compactTitle;
}

static BOOL shouldRemoveSystemInjectedMenuItem(NSMenuItem *item) {
    if (item.action == @selector(toggleFullScreen:)) {
        return YES;
    }

    NSString *compactTitle = compactSystemMenuTitle(item.title);
    return [compactTitle isEqualToString:@"autofile"] || [compactTitle isEqualToString:@"autofill"];
}

static void removeSystemInjectedItemsFromMenu(NSMenu *menu) {
    NSArray<NSMenuItem *> *items = [menu.itemArray copy];
    for (NSMenuItem *item in items) {
        if (shouldRemoveSystemInjectedMenuItem(item)) {
            [menu removeItem:item];
        }
    }
    [items release];
}

@interface FastMDSystemMenuCleaner : NSObject <NSMenuDelegate>
@end

@implementation FastMDSystemMenuCleaner
- (void)menuNeedsUpdate:(NSMenu *)menu {
    removeSystemInjectedItemsFromMenu(menu);
}

- (void)menuWillOpen:(NSMenu *)menu {
    removeSystemInjectedItemsFromMenu(menu);
}
@end

void setupTopBorderDoubleClick(void *nswin) {
    NSWindow *window = (NSWindow *)nswin;
    if (objc_getAssociatedObject(window, &kSetupKey)) return;
    objc_setAssociatedObject(window, &kSetupKey, @YES, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

    [NSEvent addLocalMonitorForEventsMatchingMask:NSEventMaskLeftMouseDown handler:^NSEvent *(NSEvent *event) {
        if (event.window != window || event.clickCount != 2) return event;

        NSPoint loc = [NSEvent mouseLocation];
        NSRect  frame = window.frame;
        CGFloat top   = frame.origin.y + frame.size.height;

        if (loc.x < frame.origin.x || loc.x > frame.origin.x + frame.size.width) return event;
        if (loc.y < top - 28       || loc.y > top + 2)                            return event;

        NSValue *savedVal = objc_getAssociatedObject(window, &kSavedFrameKey);
        BOOL isExpanded   = [objc_getAssociatedObject(window, &kExpandedKey) boolValue];

        if (isExpanded && savedVal) {
            [window setFrame:savedVal.rectValue display:YES animate:YES];
            objc_setAssociatedObject(window, &kExpandedKey, @NO, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        } else {
            objc_setAssociatedObject(window, &kSavedFrameKey,
                [NSValue valueWithRect:frame], OBJC_ASSOCIATION_RETAIN_NONATOMIC);
            objc_setAssociatedObject(window, &kExpandedKey, @YES, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
            NSScreen *screen = window.screen ?: [NSScreen mainScreen];
            [window setFrame:screen.visibleFrame display:YES animate:YES];
        }
        return nil;
    }];
}

void installSystemMenuCleaner(char *menuTitle) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *title = [NSString stringWithUTF8String:menuTitle];
        free(menuTitle);

        NSMenu *mainMenu = [NSApp mainMenu];
        NSMenuItem *menuItem = [mainMenu itemWithTitle:title];
        if (!menuItem || !menuItem.submenu) return;

        NSMenu *menu = menuItem.submenu;
        FastMDSystemMenuCleaner *cleaner = objc_getAssociatedObject(menu, &kSystemMenuCleanerKey);
        if (!cleaner) {
            cleaner = [FastMDSystemMenuCleaner new];
            objc_setAssociatedObject(menu, &kSystemMenuCleanerKey, cleaner, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
            [cleaner release];
        }
        menu.delegate = cleaner;
        removeSystemInjectedItemsFromMenu(menu);
    });
}

void installCustomHelpMenu(char *helpTitle) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *title = [NSString stringWithUTF8String:helpTitle];
        free(helpTitle);

        NSMenu *mainMenu = [NSApp mainMenu];
        NSMenuItem *helpMenuItem = [mainMenu itemWithTitle:title];
        if (!helpMenuItem || !helpMenuItem.submenu) return;

        // AppKit injects Spotlight for Help into the visible help menu. Pointing
        // NSApp.helpMenu at a detached menu suppresses that system search row.
        NSMenu *hiddenHelpMenu = [[[NSMenu alloc] initWithTitle:@""] autorelease];
        [NSApp setHelpMenu:hiddenHelpMenu];

        NSMenu *helpMenu = helpMenuItem.submenu;
        FastMDCustomHelpMenuCleaner *cleaner = objc_getAssociatedObject(helpMenu, &kCustomHelpMenuCleanerKey);
        if (!cleaner) {
            cleaner = [FastMDCustomHelpMenuCleaner new];
            objc_setAssociatedObject(helpMenu, &kCustomHelpMenuCleanerKey, cleaner, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
            [cleaner release];
        }
        helpMenu.delegate = cleaner;
        removeSystemHelpItemsFromMenu(helpMenu);
    });
}

static NSMenuItem *findMenuItemByTitle(NSMenu *menu, NSString *title) {
    for (NSMenuItem *item in menu.itemArray) {
        if ([item.title isEqualToString:title]) {
            return item;
        }
    }
    return nil;
}

static void applyDeveloperToolsShortcutDisplay(NSMenuItem *item, NSString *baseTitle, NSString *shortcut) {
    if (!item) return;

    item.title = baseTitle;
    item.keyEquivalent = @"";
    item.keyEquivalentModifierMask = 0;
    if ([item respondsToSelector:@selector(setBadge:)]) {
        [item performSelector:@selector(setBadge:) withObject:nil];
    }

    NSDictionary *titleAttrs = @{
        NSFontAttributeName: [NSFont menuFontOfSize:0],
    };
    CGFloat titleWidth = [baseTitle sizeWithAttributes:titleAttrs].width;
    CGFloat shortcutWidth = [shortcut sizeWithAttributes:titleAttrs].width;
    CGFloat width = MAX(230, 38 + titleWidth + 28 + shortcutWidth + 18);

    FastMDShortcutMenuItemView *view = [[[FastMDShortcutMenuItemView alloc] initWithTitle:baseTitle shortcut:shortcut icon:item.image width:width] autorelease];
    item.view = view;
    objc_setAssociatedObject(item, &kDeveloperToolsShortcutViewKey, view, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

void installDeveloperToolsShortcutDisplay(char *viewTitle, char *itemTitle, char *shortcut) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *view = [NSString stringWithUTF8String:viewTitle];
        NSString *title = [NSString stringWithUTF8String:itemTitle];
        NSString *key = [NSString stringWithUTF8String:shortcut];
        free(viewTitle);
        free(itemTitle);
        free(shortcut);

        NSMenu *mainMenu = [NSApp mainMenu];
        NSMenuItem *viewMenuItem = [mainMenu itemWithTitle:view];
        if (!viewMenuItem || !viewMenuItem.submenu) return;

        NSMenuItem *developerToolsItem = findMenuItemByTitle(viewMenuItem.submenu, title);
        if (!developerToolsItem) return;

        applyDeveloperToolsShortcutDisplay(developerToolsItem, title, key);
    });
}
*/
import "C"
import "unsafe"

func toggleDevTools(nsWindow unsafe.Pointer) {
	C.toggleDevTools(nsWindow)
}

func positionTrafficLights(nsWindow unsafe.Pointer, x, y float64) {
	C.positionTrafficLights(nsWindow, C.double(x), C.double(y), C.double(9))
}

func setupTopBorderDoubleClick(nsWindow unsafe.Pointer) {
	C.setupTopBorderDoubleClick(nsWindow)
}

func installSystemMenuCleaner(menuTitle string) {
	C.installSystemMenuCleaner(C.CString(menuTitle))
}

func installDeveloperToolsShortcutDisplay(viewTitle, itemTitle, shortcut string) {
	C.installDeveloperToolsShortcutDisplay(C.CString(viewTitle), C.CString(itemTitle), C.CString(shortcut))
}

func installCustomHelpMenu(helpTitle string) {
	C.installCustomHelpMenu(C.CString(helpTitle))
}
