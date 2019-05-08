(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.bitmovin || (g.bitmovin = {})).playerui = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ArrayUtils;
(function (ArrayUtils) {
    /**
     * Removes an item from an array.
     * @param array the array that may contain the item to remove
     * @param item the item to remove from the array
     * @returns {any} the removed item or null if it wasn't part of the array
     */
    function remove(array, item) {
        var index = array.indexOf(item);
        if (index > -1) {
            return array.splice(index, 1)[0];
        }
        else {
            return null;
        }
    }
    ArrayUtils.remove = remove;
})(ArrayUtils = exports.ArrayUtils || (exports.ArrayUtils = {}));
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helper class to handle all audio tracks related events
 *
 * This class listens to player events as well as the `ListSelector` event if selection changed
 */
var AudioTrackSwitchHandler = /** @class */ (function () {
    function AudioTrackSwitchHandler(player, element, uimanager) {
        this.player = player;
        this.listElement = element;
        this.uimanager = uimanager;
        this.bindSelectionEvent();
        this.bindPlayerEvents();
        this.updateAudioTracks();
    }
    AudioTrackSwitchHandler.prototype.bindSelectionEvent = function () {
        var _this = this;
        this.listElement.onItemSelected.subscribe(function (_, value) {
            _this.player.setAudio(value);
        });
    };
    AudioTrackSwitchHandler.prototype.bindPlayerEvents = function () {
        var _this = this;
        var updateAudioTracksCallback = function () { return _this.updateAudioTracks(); };
        // Update selection when selected track has changed
        this.player.on(this.player.exports.PlayerEvent.AudioChanged, function () {
            _this.selectCurrentAudioTrack();
        });
        // Update tracks when source goes away
        this.player.on(this.player.exports.PlayerEvent.SourceUnloaded, updateAudioTracksCallback);
        // Update tracks when the period within a source changes
        this.player.on(this.player.exports.PlayerEvent.PeriodSwitched, updateAudioTracksCallback);
        // Update tracks when a track is added or removed
        this.player.on(this.player.exports.PlayerEvent.AudioAdded, updateAudioTracksCallback);
        this.player.on(this.player.exports.PlayerEvent.AudioRemoved, updateAudioTracksCallback);
        this.uimanager.getConfig().events.onUpdated.subscribe(updateAudioTracksCallback);
    };
    AudioTrackSwitchHandler.prototype.updateAudioTracks = function () {
        this.listElement.clearItems();
        // Add audio tracks
        for (var _i = 0, _a = this.player.getAvailableAudio(); _i < _a.length; _i++) {
            var audioTrack = _a[_i];
            this.listElement.addItem(audioTrack.id, audioTrack.label);
        }
        // Select the correct audio track after the tracks have been added
        // This is also important in case we missed the `ON_AUDIO_CHANGED` event, e.g. when `playback.audioLanguage`
        // is configured but the event is fired before the UI is created.
        this.selectCurrentAudioTrack();
    };
    AudioTrackSwitchHandler.prototype.selectCurrentAudioTrack = function () {
        var currentAudioTrack = this.player.getAudio();
        // HLS streams don't always provide this, so we have to check
        if (currentAudioTrack) {
            this.listElement.selectItem(currentAudioTrack.id);
        }
    };
    return AudioTrackSwitchHandler;
}());
exports.AudioTrackSwitchHandler = AudioTrackSwitchHandler;
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BrowserUtils;
(function (BrowserUtils) {
    // isMobile only needs to be evaluated once (it cannot change during a browser session)
    // Mobile detection according to Mozilla recommendation: "In summary, we recommend looking for the string “Mobi”
    // anywhere in the User Agent to detect a mobile device."
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
    BrowserUtils.isMobile = navigator && navigator.userAgent && /Mobi/.test(navigator.userAgent);
    BrowserUtils.isChrome = navigator && navigator.userAgent && /Chrome/.test(navigator.userAgent);
    BrowserUtils.isAndroid = navigator && navigator.userAgent && /Android/.test(navigator.userAgent);
})(BrowserUtils = exports.BrowserUtils || (exports.BrowserUtils = {}));
},{}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var clickoverlay_1 = require("./clickoverlay");
/**
 * A simple click capture overlay for clickThroughUrls of ads.
 */
var AdClickOverlay = /** @class */ (function (_super) {
    __extends(AdClickOverlay, _super);
    function AdClickOverlay() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AdClickOverlay.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var clickThroughCallback = null;
        player.on(player.exports.PlayerEvent.AdStarted, function (event) {
            var ad = event.ad;
            _this.setUrl(ad.clickThroughUrl);
            clickThroughCallback = ad.clickThroughUrlOpened;
        });
        // Clear click-through URL when ad has finished
        var adFinishedHandler = function () {
            _this.setUrl(null);
        };
        player.on(player.exports.PlayerEvent.AdFinished, adFinishedHandler);
        player.on(player.exports.PlayerEvent.AdSkipped, adFinishedHandler);
        player.on(player.exports.PlayerEvent.AdError, adFinishedHandler);
        this.onClick.subscribe(function () {
            // Pause the ad when overlay is clicked
            player.pause('ui-ad-click-overlay');
            if (clickThroughCallback) {
                clickThroughCallback();
            }
        });
    };
    return AdClickOverlay;
}(clickoverlay_1.ClickOverlay));
exports.AdClickOverlay = AdClickOverlay;
},{"./clickoverlay":16}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var label_1 = require("./label");
var stringutils_1 = require("../stringutils");
/**
 * A label that displays a message about a running ad, optionally with a countdown.
 */
var AdMessageLabel = /** @class */ (function (_super) {
    __extends(AdMessageLabel, _super);
    function AdMessageLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-label-ad-message',
            text: 'This ad will end in {remainingTime} seconds.',
        }, _this.config);
        return _this;
    }
    AdMessageLabel.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        var text = config.text;
        var updateMessageHandler = function () {
            _this.setText(stringutils_1.StringUtils.replaceAdMessagePlaceholders(text, null, player));
        };
        var adStartHandler = function (event) {
            var uiConfig = event.ad.uiConfig;
            text = uiConfig && uiConfig.message || config.text;
            updateMessageHandler();
            player.on(player.exports.PlayerEvent.TimeChanged, updateMessageHandler);
        };
        var adEndHandler = function () {
            player.off(player.exports.PlayerEvent.TimeChanged, updateMessageHandler);
        };
        player.on(player.exports.PlayerEvent.AdStarted, adStartHandler);
        player.on(player.exports.PlayerEvent.AdSkipped, adEndHandler);
        player.on(player.exports.PlayerEvent.AdError, adEndHandler);
        player.on(player.exports.PlayerEvent.AdFinished, adEndHandler);
    };
    return AdMessageLabel;
}(label_1.Label));
exports.AdMessageLabel = AdMessageLabel;
},{"../stringutils":83,"./label":26}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("./button");
var stringutils_1 = require("../stringutils");
/**
 * A button that is displayed during ads and can be used to skip the ad.
 */
var AdSkipButton = /** @class */ (function (_super) {
    __extends(AdSkipButton, _super);
    function AdSkipButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-button-ad-skip',
            untilSkippableMessage: 'Skip ad in {remainingTime}',
            skippableMessage: 'Skip ad',
        }, _this.config);
        return _this;
    }
    AdSkipButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig(); // TODO get rid of generic cast
        var untilSkippableMessage = config.untilSkippableMessage;
        var skippableMessage = config.skippableMessage;
        var skipOffset = -1;
        var updateSkipMessageHandler = function () {
            _this.show();
            // Update the skip message on the button
            if (player.getCurrentTime() < skipOffset) {
                _this.setText(stringutils_1.StringUtils.replaceAdMessagePlaceholders(untilSkippableMessage, skipOffset, player));
                _this.disable();
            }
            else {
                _this.setText(skippableMessage);
                _this.enable();
            }
        };
        var adStartHandler = function (event) {
            var ad = event.ad;
            skipOffset = ad.skippableAfter;
            untilSkippableMessage = ad.uiConfig && ad.uiConfig.untilSkippableMessage || config.untilSkippableMessage;
            skippableMessage = ad.uiConfig && ad.uiConfig.skippableMessage || config.skippableMessage;
            // Display this button only if ad is skippable.
            // Non-skippable ads will return -1 for skippableAfter for player version < v8.3.0.
            if (typeof skipOffset === 'number' && skipOffset >= 0) {
                updateSkipMessageHandler();
                player.on(player.exports.PlayerEvent.TimeChanged, updateSkipMessageHandler);
            }
            else {
                _this.hide();
            }
        };
        var adEndHandler = function () {
            player.off(player.exports.PlayerEvent.TimeChanged, updateSkipMessageHandler);
        };
        player.on(player.exports.PlayerEvent.AdStarted, adStartHandler);
        player.on(player.exports.PlayerEvent.AdSkipped, adEndHandler);
        player.on(player.exports.PlayerEvent.AdError, adEndHandler);
        player.on(player.exports.PlayerEvent.AdFinished, adEndHandler);
        this.onClick.subscribe(function () {
            // Try to skip the ad (this only works if it is skippable so we don't need to take extra care of that here)
            player.ads.skip();
        });
    };
    return AdSkipButton;
}(button_1.Button));
exports.AdSkipButton = AdSkipButton;
},{"../stringutils":83,"./button":12}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles Apple AirPlay.
 */
var AirPlayToggleButton = /** @class */ (function (_super) {
    __extends(AirPlayToggleButton, _super);
    function AirPlayToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-airplaytogglebutton',
            text: 'Apple AirPlay',
        }, _this.config);
        return _this;
    }
    AirPlayToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        if (!player.isAirplayAvailable) {
            // If the player does not support Airplay (player 7.0), we just hide this component and skip configuration
            this.hide();
            return;
        }
        this.onClick.subscribe(function () {
            if (player.isAirplayAvailable()) {
                player.showAirplayTargetPicker();
            }
            else {
                if (console) {
                    console.log('AirPlay unavailable');
                }
            }
        });
        var airPlayAvailableHandler = function () {
            if (player.isAirplayAvailable()) {
                _this.show();
            }
            else {
                _this.hide();
            }
        };
        player.on(player.exports.PlayerEvent.AirplayAvailable, airPlayAvailableHandler);
        // Startup init
        airPlayAvailableHandler(); // Hide button if AirPlay is not available
    };
    return AirPlayToggleButton;
}(togglebutton_1.ToggleButton));
exports.AirPlayToggleButton = AirPlayToggleButton;
},{"./togglebutton":65}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection between 'auto' and the available audio qualities.
 */
var AudioQualitySelectBox = /** @class */ (function (_super) {
    __extends(AudioQualitySelectBox, _super);
    function AudioQualitySelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-audioqualityselectbox'],
        }, _this.config);
        return _this;
    }
    AudioQualitySelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var selectCurrentAudioQuality = function () {
            _this.selectItem(player.getAudioQuality().id);
        };
        var updateAudioQualities = function () {
            var audioQualities = player.getAvailableAudioQualities();
            _this.clearItems();
            // Add entry for automatic quality switching (default setting)
            _this.addItem('auto', 'auto');
            // Add audio qualities
            for (var _i = 0, audioQualities_1 = audioQualities; _i < audioQualities_1.length; _i++) {
                var audioQuality = audioQualities_1[_i];
                _this.addItem(audioQuality.id, audioQuality.label);
            }
            // Select initial quality
            selectCurrentAudioQuality();
        };
        this.onItemSelected.subscribe(function (sender, value) {
            player.setAudioQuality(value);
        });
        // Update qualities when audio track has changed
        player.on(player.exports.PlayerEvent.AudioChanged, updateAudioQualities);
        // Update qualities when source goes away
        player.on(player.exports.PlayerEvent.SourceUnloaded, updateAudioQualities);
        // Update qualities when the period within a source changes
        player.on(player.exports.PlayerEvent.PeriodSwitched, updateAudioQualities);
        // Update quality selection when quality is changed (from outside)
        player.on(player.exports.PlayerEvent.AudioQualityChanged, selectCurrentAudioQuality);
        if (player.exports.PlayerEvent.AudioQualityAdded) {
            // Update qualities when their availability changed
            // TODO: remove any cast after next player release
            player.on(player.exports.PlayerEvent.AudioQualityAdded, updateAudioQualities);
            player.on(player.exports.PlayerEvent.AudioQualityRemoved, updateAudioQualities);
        }
        uimanager.getConfig().events.onUpdated.subscribe(updateAudioQualities);
    };
    return AudioQualitySelectBox;
}(selectbox_1.SelectBox));
exports.AudioQualitySelectBox = AudioQualitySelectBox;
},{"./selectbox":38}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var listbox_1 = require("./listbox");
var audiotrackutils_1 = require("../audiotrackutils");
/**
 * A element that is similar to a select box where the user can select a subtitle
 */
var AudioTrackListBox = /** @class */ (function (_super) {
    __extends(AudioTrackListBox, _super);
    function AudioTrackListBox() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AudioTrackListBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        new audiotrackutils_1.AudioTrackSwitchHandler(player, this, uimanager);
    };
    return AudioTrackListBox;
}(listbox_1.ListBox));
exports.AudioTrackListBox = AudioTrackListBox;
},{"../audiotrackutils":2,"./listbox":27}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var selectbox_1 = require("./selectbox");
var audiotrackutils_1 = require("../audiotrackutils");
/**
 * A select box providing a selection between available audio tracks (e.g. different languages).
 */
var AudioTrackSelectBox = /** @class */ (function (_super) {
    __extends(AudioTrackSelectBox, _super);
    function AudioTrackSelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-audiotrackselectbox'],
        }, _this.config);
        return _this;
    }
    AudioTrackSelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        new audiotrackutils_1.AudioTrackSwitchHandler(player, this, uimanager);
    };
    return AudioTrackSelectBox;
}(selectbox_1.SelectBox));
exports.AudioTrackSelectBox = AudioTrackSelectBox;
},{"../audiotrackutils":2,"./selectbox":38}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var component_1 = require("./component");
var timeout_1 = require("../timeout");
/**
 * Overlays the player and displays a buffering indicator.
 */
var BufferingOverlay = /** @class */ (function (_super) {
    __extends(BufferingOverlay, _super);
    function BufferingOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.indicators = [
            new component_1.Component({ tag: 'div', cssClass: 'ui-buffering-overlay-indicator' }),
            new component_1.Component({ tag: 'div', cssClass: 'ui-buffering-overlay-indicator' }),
            new component_1.Component({ tag: 'div', cssClass: 'ui-buffering-overlay-indicator' }),
        ];
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-buffering-overlay',
            hidden: true,
            components: _this.indicators,
            showDelayMs: 1000,
        }, _this.config);
        return _this;
    }
    BufferingOverlay.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        var overlayShowTimeout = new timeout_1.Timeout(config.showDelayMs, function () {
            _this.show();
        });
        var showOverlay = function () {
            overlayShowTimeout.start();
        };
        var hideOverlay = function () {
            overlayShowTimeout.clear();
            _this.hide();
        };
        player.on(player.exports.PlayerEvent.StallStarted, showOverlay);
        player.on(player.exports.PlayerEvent.StallEnded, hideOverlay);
        player.on(player.exports.PlayerEvent.Play, showOverlay);
        player.on(player.exports.PlayerEvent.Playing, hideOverlay);
        player.on(player.exports.PlayerEvent.Paused, hideOverlay);
        player.on(player.exports.PlayerEvent.Seek, showOverlay);
        player.on(player.exports.PlayerEvent.Seeked, hideOverlay);
        player.on(player.exports.PlayerEvent.TimeShift, showOverlay);
        player.on(player.exports.PlayerEvent.TimeShifted, hideOverlay);
        player.on(player.exports.PlayerEvent.SourceUnloaded, hideOverlay);
        // Show overlay if player is already stalled at init
        if (player.isStalled()) {
            this.show();
        }
    };
    return BufferingOverlay;
}(container_1.Container));
exports.BufferingOverlay = BufferingOverlay;
},{"../timeout":85,"./component":18,"./container":19}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A simple clickable button.
 */
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button(config) {
        var _this = _super.call(this, config) || this;
        _this.buttonEvents = {
            onClick: new eventdispatcher_1.EventDispatcher(),
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-button',
        }, _this.config);
        return _this;
    }
    Button.prototype.toDomElement = function () {
        var _this = this;
        // Create the button element with the text label
        var buttonElement = new dom_1.DOM('button', {
            'type': 'button',
            'id': this.config.id,
            'class': this.getCssClasses(),
        }).append(new dom_1.DOM('span', {
            'class': this.prefixCss('label'),
        }).html(this.config.text));
        // Listen for the click event on the button element and trigger the corresponding event on the button component
        buttonElement.on('click', function () {
            _this.onClickEvent();
        });
        return buttonElement;
    };
    /**
     * Sets text on the label of the button.
     * @param text the text to put into the label of the button
     */
    Button.prototype.setText = function (text) {
        this.getDomElement().find('.' + this.prefixCss('label')).html(text);
    };
    Button.prototype.onClickEvent = function () {
        this.buttonEvents.onClick.dispatch(this);
    };
    Object.defineProperty(Button.prototype, "onClick", {
        /**
         * Gets the event that is fired when the button is clicked.
         * @returns {Event<Button<Config>, NoArgs>}
         */
        get: function () {
            return this.buttonEvents.onClick.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return Button;
}(component_1.Component));
exports.Button = Button;
},{"../dom":75,"../eventdispatcher":77,"./component":18}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var label_1 = require("./label");
/**
 * Overlays the player and displays the status of a Cast session.
 */
var CastStatusOverlay = /** @class */ (function (_super) {
    __extends(CastStatusOverlay, _super);
    function CastStatusOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.statusLabel = new label_1.Label({ cssClass: 'ui-cast-status-label' });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-cast-status-overlay',
            components: [_this.statusLabel],
            hidden: true,
        }, _this.config);
        return _this;
    }
    CastStatusOverlay.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        player.on(player.exports.PlayerEvent.CastWaitingForDevice, function (event) {
            _this.show();
            // Get device name and update status text while connecting
            var castDeviceName = event.castPayload.deviceName;
            _this.statusLabel.setText("Conectando ao dispositivo <strong>" + castDeviceName + "</strong>...");
        });
        player.on(player.exports.PlayerEvent.CastStarted, function (event) {
            // Session is started or resumed
            // For cases when a session is resumed, we do not receive the previous events and therefore show the status panel
            // here too
            _this.show();
            var castDeviceName = event.deviceName;
            _this.statusLabel.setText("Reproduzindo em <strong>" + castDeviceName + "</strong>");
        });
        player.on(player.exports.PlayerEvent.CastStopped, function (event) {
            // Cast session gone, hide the status panel
            _this.hide();
        });
    };
    return CastStatusOverlay;
}(container_1.Container));
exports.CastStatusOverlay = CastStatusOverlay;
},{"./container":19,"./label":26}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles casting to a Cast receiver.
 */
var CastToggleButton = /** @class */ (function (_super) {
    __extends(CastToggleButton, _super);
    function CastToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-casttogglebutton',
            text: 'Google Cast',
        }, _this.config);
        return _this;
    }
    CastToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            if (player.isCastAvailable()) {
                if (player.isCasting()) {
                    player.castStop();
                }
                else {
                    player.castVideo();
                }
            }
            else {
                if (console) {
                    console.log('Cast unavailable');
                }
            }
        });
        var castAvailableHander = function () {
            if (player.isCastAvailable()) {
                _this.show();
            }
            else {
                _this.hide();
            }
        };
        player.on(player.exports.PlayerEvent.CastAvailable, castAvailableHander);
        // Toggle button 'on' state
        player.on(player.exports.PlayerEvent.CastWaitingForDevice, function () {
            _this.on();
        });
        player.on(player.exports.PlayerEvent.CastStarted, function () {
            // When a session is resumed, there is no CastStart event, so we also need to toggle here for such cases
            _this.on();
        });
        player.on(player.exports.PlayerEvent.CastStopped, function () {
            _this.off();
        });
        // Startup init
        castAvailableHander(); // Hide button if Cast not available
        if (player.isCasting()) {
            this.on();
        }
    };
    return CastToggleButton;
}(togglebutton_1.ToggleButton));
exports.CastToggleButton = CastToggleButton;
},{"./togglebutton":65}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var uicontainer_1 = require("./uicontainer");
var timeout_1 = require("../timeout");
/**
 * The base container for Cast receivers that contains all of the UI and takes care that the UI is shown on
 * certain playback events.
 */
var CastUIContainer = /** @class */ (function (_super) {
    __extends(CastUIContainer, _super);
    function CastUIContainer(config) {
        return _super.call(this, config) || this;
    }
    CastUIContainer.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        /*
         * Show UI on Cast devices at certain playback events
         *
         * Since a Cast receiver does not have a direct HCI, we show the UI on certain playback events to give the user
         * a chance to see on the screen what's going on, e.g. on play/pause or a seek the UI is shown and the user can
         * see the current time and position on the seek bar.
         * The UI is shown permanently while playback is paused, otherwise hides automatically after the configured
         * hide delay time.
         */
        var isUiShown = false;
        var hideUi = function () {
            uimanager.onControlsHide.dispatch(_this);
            isUiShown = false;
        };
        this.castUiHideTimeout = new timeout_1.Timeout(config.hideDelay, hideUi);
        var showUi = function () {
            if (!isUiShown) {
                uimanager.onControlsShow.dispatch(_this);
                isUiShown = true;
            }
        };
        var showUiPermanently = function () {
            showUi();
            _this.castUiHideTimeout.clear();
        };
        var showUiWithTimeout = function () {
            showUi();
            _this.castUiHideTimeout.start();
        };
        var showUiAfterSeek = function () {
            if (player.isPlaying()) {
                showUiWithTimeout();
            }
            else {
                showUiPermanently();
            }
        };
        player.on(player.exports.PlayerEvent.Play, showUiWithTimeout);
        player.on(player.exports.PlayerEvent.Paused, showUiPermanently);
        player.on(player.exports.PlayerEvent.Seek, showUiPermanently);
        player.on(player.exports.PlayerEvent.Seeked, showUiAfterSeek);
        uimanager.getConfig().events.onUpdated.subscribe(showUiWithTimeout);
    };
    CastUIContainer.prototype.release = function () {
        _super.prototype.release.call(this);
        this.castUiHideTimeout.clear();
    };
    return CastUIContainer;
}(uicontainer_1.UIContainer));
exports.CastUIContainer = CastUIContainer;
},{"../timeout":85,"./uicontainer":67}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("./button");
/**
 * A click overlay that opens an url in a new tab if clicked.
 */
var ClickOverlay = /** @class */ (function (_super) {
    __extends(ClickOverlay, _super);
    function ClickOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-clickoverlay',
        }, _this.config);
        return _this;
    }
    ClickOverlay.prototype.initialize = function () {
        _super.prototype.initialize.call(this);
        this.setUrl(this.config.url);
        var element = this.getDomElement();
        element.on('click', function () {
            if (element.data('url')) {
                window.open(element.data('url'), '_blank');
            }
        });
    };
    /**
     * Gets the URL that should be followed when the watermark is clicked.
     * @returns {string} the watermark URL
     */
    ClickOverlay.prototype.getUrl = function () {
        return this.getDomElement().data('url');
    };
    ClickOverlay.prototype.setUrl = function (url) {
        if (url === undefined || url == null) {
            url = '';
        }
        this.getDomElement().data('url', url);
    };
    return ClickOverlay;
}(button_1.Button));
exports.ClickOverlay = ClickOverlay;
},{"./button":12}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("./button");
/**
 * A button that closes (hides) a configured component.
 */
var CloseButton = /** @class */ (function (_super) {
    __extends(CloseButton, _super);
    function CloseButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-closebutton',
            text: 'Close',
        }, _this.config);
        return _this;
    }
    CloseButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        this.onClick.subscribe(function () {
            config.target.hide();
        });
    };
    return CloseButton;
}(button_1.Button));
exports.CloseButton = CloseButton;
},{"./button":12}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var guid_1 = require("../guid");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * The base class of the UI framework.
 * Each component must extend this class and optionally the config interface.
 */
var Component = /** @class */ (function () {
    /**
     * Constructs a component with an optionally supplied config. All subclasses must call the constructor of their
     * superclass and then merge their configuration into the component's configuration.
     * @param config the configuration for the component
     */
    function Component(config) {
        if (config === void 0) { config = {}; }
        /**
         * The list of events that this component offers. These events should always be private and only directly
         * accessed from within the implementing component.
         *
         * Because TypeScript does not support private properties with the same name on different class hierarchy levels
         * (i.e. superclass and subclass cannot contain a private property with the same name), the default naming
         * convention for the event list of a component that should be followed by subclasses is the concatenation of the
         * camel-cased class name + 'Events' (e.g. SubClass extends Component => subClassEvents).
         * See {@link #componentEvents} for an example.
         *
         * Event properties should be named in camel case with an 'on' prefix and in the present tense. Async events may
         * have a start event (when the operation starts) in the present tense, and must have an end event (when the
         * operation ends) in the past tense (or present tense in special cases (e.g. onStart/onStarted or onPlay/onPlaying).
         * See {@link #componentEvents#onShow} for an example.
         *
         * Each event should be accompanied with a protected method named by the convention eventName + 'Event'
         * (e.g. onStartEvent), that actually triggers the event by calling {@link EventDispatcher#dispatch dispatch} and
         * passing a reference to the component as first parameter. Components should always trigger their events with these
         * methods. Implementing this pattern gives subclasses means to directly listen to the events by overriding the
         * method (and saving the overhead of passing a handler to the event dispatcher) and more importantly to trigger
         * these events without having access to the private event list.
         * See {@link #onShow} for an example.
         *
         * To provide external code the possibility to listen to this component's events (subscribe, unsubscribe, etc.),
         * each event should also be accompanied by a public getter function with the same name as the event's property,
         * that returns the {@link Event} obtained from the event dispatcher by calling {@link EventDispatcher#getEvent}.
         * See {@link #onShow} for an example.
         *
         * Full example for an event representing an example action in a example component:
         *
         * <code>
         * // Define an example component class with an example event
         * class ExampleComponent extends Component<ComponentConfig> {
           *
           *     private exampleComponentEvents = {
           *         onExampleAction: new EventDispatcher<ExampleComponent, NoArgs>()
           *     }
           *
           *     // constructor and other stuff...
           *
           *     protected onExampleActionEvent() {
           *        this.exampleComponentEvents.onExampleAction.dispatch(this);
           *    }
           *
           *    get onExampleAction(): Event<ExampleComponent, NoArgs> {
           *        return this.exampleComponentEvents.onExampleAction.getEvent();
           *    }
           * }
         *
         * // Create an instance of the component somewhere
         * var exampleComponentInstance = new ExampleComponent();
         *
         * // Subscribe to the example event on the component
         * exampleComponentInstance.onExampleAction.subscribe(function (sender: ExampleComponent) {
           *     console.log('onExampleAction of ' + sender + ' has fired!');
           * });
         * </code>
         */
        this.componentEvents = {
            onShow: new eventdispatcher_1.EventDispatcher(),
            onHide: new eventdispatcher_1.EventDispatcher(),
            onHoverChanged: new eventdispatcher_1.EventDispatcher(),
            onEnabled: new eventdispatcher_1.EventDispatcher(),
            onDisabled: new eventdispatcher_1.EventDispatcher(),
        };
        // Create the configuration for this component
        this.config = this.mergeConfig(config, {
            tag: 'div',
            id: 'bmpui-id-' + guid_1.Guid.next(),
            cssPrefix: 'bmpui',
            cssClass: 'ui-component',
            cssClasses: [],
            hidden: false,
            disabled: false,
        }, {});
    }
    /**
     * Initializes the component, e.g. by applying config settings.
     * This method must not be called from outside the UI framework.
     *
     * This method is automatically called by the {@link UIInstanceManager}. If the component is an inner component of
     * some component, and thus encapsulated abd managed internally and never directly exposed to the UIManager,
     * this method must be called from the managing component's {@link #initialize} method.
     */
    Component.prototype.initialize = function () {
        this.hidden = this.config.hidden;
        this.disabled = this.config.disabled;
        // Hide the component at initialization if it is configured to be hidden
        if (this.isHidden()) {
            this.hidden = false; // Set flag to false for the following hide() call to work (hide() checks the flag)
            this.hide();
        }
        // Disable the component at initialization if it is configured to be disabled
        if (this.isDisabled()) {
            this.disabled = false; // Set flag to false for the following disable() call to work (disable() checks the flag)
            this.disable();
        }
    };
    /**
     * Configures the component for the supplied Player and UIInstanceManager. This is the place where all the magic
     * happens, where components typically subscribe and react to events (on their DOM element, the Player, or the
     * UIInstanceManager), and basically everything that makes them interactive.
     * This method is called only once, when the UIManager initializes the UI.
     *
     * Subclasses usually overwrite this method to add their own functionality.
     *
     * @param player the player which this component controls
     * @param uimanager the UIInstanceManager that manages this component
     */
    Component.prototype.configure = function (player, uimanager) {
        var _this = this;
        this.onShow.subscribe(function () {
            uimanager.onComponentShow.dispatch(_this);
        });
        this.onHide.subscribe(function () {
            uimanager.onComponentHide.dispatch(_this);
        });
        // Track the hovered state of the element
        this.getDomElement().on('mouseenter', function () {
            _this.onHoverChangedEvent(true);
        });
        this.getDomElement().on('mouseleave', function () {
            _this.onHoverChangedEvent(false);
        });
    };
    /**
     * Releases all resources and dependencies that the component holds. Player, DOM, and UIManager events are
     * automatically removed during release and do not explicitly need to be removed here.
     * This method is called by the UIManager when it releases the UI.
     *
     * Subclasses that need to release resources should override this method and call super.release().
     */
    Component.prototype.release = function () {
        // Nothing to do here, override where necessary
    };
    /**
     * Generate the DOM element for this component.
     *
     * Subclasses usually overwrite this method to extend or replace the DOM element with their own design.
     */
    Component.prototype.toDomElement = function () {
        var element = new dom_1.DOM(this.config.tag, {
            'id': this.config.id,
            'class': this.getCssClasses(),
        });
        return element;
    };
    /**
     * Returns the DOM element of this component. Creates the DOM element if it does not yet exist.
     *
     * Should not be overwritten by subclasses.
     *
     * @returns {DOM}
     */
    Component.prototype.getDomElement = function () {
        if (!this.element) {
            this.element = this.toDomElement();
        }
        return this.element;
    };
    /**
     * Merges a configuration with a default configuration and a base configuration from the superclass.
     *
     * @param config the configuration settings for the components, as usually passed to the constructor
     * @param defaults a default configuration for settings that are not passed with the configuration
     * @param base configuration inherited from a superclass
     * @returns {Config}
     */
    Component.prototype.mergeConfig = function (config, defaults, base) {
        // Extend default config with supplied config
        var merged = Object.assign({}, base, defaults, config);
        // Return the extended config
        return merged;
    };
    /**
     * Helper method that returns a string of all CSS classes of the component.
     *
     * @returns {string}
     */
    Component.prototype.getCssClasses = function () {
        var _this = this;
        // Merge all CSS classes into single array
        var flattenedArray = [this.config.cssClass].concat(this.config.cssClasses);
        // Prefix classes
        flattenedArray = flattenedArray.map(function (css) {
            return _this.prefixCss(css);
        });
        // Join array values into a string
        var flattenedString = flattenedArray.join(' ');
        // Return trimmed string to prevent whitespace at the end from the join operation
        return flattenedString.trim();
    };
    Component.prototype.prefixCss = function (cssClassOrId) {
        return this.config.cssPrefix + '-' + cssClassOrId;
    };
    /**
     * Returns the configuration object of the component.
     * @returns {Config}
     */
    Component.prototype.getConfig = function () {
        return this.config;
    };
    /**
     * Hides the component if shown.
     * This method basically transfers the component into the hidden state. Actual hiding is done via CSS.
     */
    Component.prototype.hide = function () {
        if (!this.hidden) {
            this.hidden = true;
            this.getDomElement().addClass(this.prefixCss(Component.CLASS_HIDDEN));
            this.onHideEvent();
        }
    };
    /**
     * Shows the component if hidden.
     */
    Component.prototype.show = function () {
        if (this.hidden) {
            this.getDomElement().removeClass(this.prefixCss(Component.CLASS_HIDDEN));
            this.hidden = false;
            this.onShowEvent();
        }
    };
    /**
     * Determines if the component is hidden.
     * @returns {boolean} true if the component is hidden, else false
     */
    Component.prototype.isHidden = function () {
        return this.hidden;
    };
    /**
     * Determines if the component is shown.
     * @returns {boolean} true if the component is visible, else false
     */
    Component.prototype.isShown = function () {
        return !this.isHidden();
    };
    /**
     * Toggles the hidden state by hiding the component if it is shown, or showing it if hidden.
     */
    Component.prototype.toggleHidden = function () {
        if (this.isHidden()) {
            this.show();
        }
        else {
            this.hide();
        }
    };
    /**
     * Disables the component.
     * This method basically transfers the component into the disabled state. Actual disabling is done via CSS or child
     * components. (e.g. Button needs to unsubscribe click listeners)
     */
    Component.prototype.disable = function () {
        if (!this.disabled) {
            this.disabled = true;
            this.getDomElement().addClass(this.prefixCss(Component.CLASS_DISABLED));
            this.onDisabledEvent();
        }
    };
    /**
     * Enables the component.
     * This method basically transfers the component into the enabled state. Actual enabling is done via CSS or child
     * components. (e.g. Button needs to subscribe click listeners)
     */
    Component.prototype.enable = function () {
        if (this.disabled) {
            this.getDomElement().removeClass(this.prefixCss(Component.CLASS_DISABLED));
            this.disabled = false;
            this.onEnabledEvent();
        }
    };
    /**
     * Determines if the component is disabled.
     * @returns {boolean} true if the component is disabled, else false
     */
    Component.prototype.isDisabled = function () {
        return this.disabled;
    };
    /**
     * Determines if the component is enabled.
     * @returns {boolean} true if the component is enabled, else false
     */
    Component.prototype.isEnabled = function () {
        return !this.isDisabled();
    };
    /**
     * Determines if the component is currently hovered.
     * @returns {boolean} true if the component is hovered, else false
     */
    Component.prototype.isHovered = function () {
        return this.hovered;
    };
    /**
     * Fires the onShow event.
     * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
     */
    Component.prototype.onShowEvent = function () {
        this.componentEvents.onShow.dispatch(this);
    };
    /**
     * Fires the onHide event.
     * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
     */
    Component.prototype.onHideEvent = function () {
        this.componentEvents.onHide.dispatch(this);
    };
    /**
     * Fires the onEnabled event.
     * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
     */
    Component.prototype.onEnabledEvent = function () {
        this.componentEvents.onEnabled.dispatch(this);
    };
    /**
     * Fires the onDisabled event.
     * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
     */
    Component.prototype.onDisabledEvent = function () {
        this.componentEvents.onDisabled.dispatch(this);
    };
    /**
     * Fires the onHoverChanged event.
     * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
     */
    Component.prototype.onHoverChangedEvent = function (hovered) {
        this.hovered = hovered;
        this.componentEvents.onHoverChanged.dispatch(this, { hovered: hovered });
    };
    Object.defineProperty(Component.prototype, "onShow", {
        /**
         * Gets the event that is fired when the component is showing.
         * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
         * @returns {Event<Component<Config>, NoArgs>}
         */
        get: function () {
            return this.componentEvents.onShow.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Component.prototype, "onHide", {
        /**
         * Gets the event that is fired when the component is hiding.
         * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
         * @returns {Event<Component<Config>, NoArgs>}
         */
        get: function () {
            return this.componentEvents.onHide.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Component.prototype, "onEnabled", {
        /**
         * Gets the event that is fired when the component is enabling.
         * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
         * @returns {Event<Component<Config>, NoArgs>}
         */
        get: function () {
            return this.componentEvents.onEnabled.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Component.prototype, "onDisabled", {
        /**
         * Gets the event that is fired when the component is disabling.
         * See the detailed explanation on event architecture on the {@link #componentEvents events list}.
         * @returns {Event<Component<Config>, NoArgs>}
         */
        get: function () {
            return this.componentEvents.onDisabled.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Component.prototype, "onHoverChanged", {
        /**
         * Gets the event that is fired when the component's hover-state is changing.
         * @returns {Event<Component<Config>, ComponentHoverChangedEventArgs>}
         */
        get: function () {
            return this.componentEvents.onHoverChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * The classname that is attached to the element when it is in the hidden state.
     * @type {string}
     */
    Component.CLASS_HIDDEN = 'hidden';
    /**
     * The classname that is attached to the element when it is in the disabled state.
     * @type {string}
     */
    Component.CLASS_DISABLED = 'disabled';
    return Component;
}());
exports.Component = Component;
},{"../dom":75,"../eventdispatcher":77,"../guid":78}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var dom_1 = require("../dom");
var arrayutils_1 = require("../arrayutils");
/**
 * A container component that can contain a collection of child components.
 * Components can be added at construction time through the {@link ContainerConfig#components} setting, or later
 * through the {@link Container#addComponent} method. The UIManager automatically takes care of all components, i.e. it
 * initializes and configures them automatically.
 *
 * In the DOM, the container consists of an outer <div> (that can be configured by the config) and an inner wrapper
 * <div> that contains the components. This double-<div>-structure is often required to achieve many advanced effects
 * in CSS and/or JS, e.g. animations and certain formatting with absolute positioning.
 *
 * DOM example:
 * <code>
 *     <div class='ui-container'>
 *         <div class='container-wrapper'>
 *             ... child components ...
 *         </div>
 *     </div>
 * </code>
 */
var Container = /** @class */ (function (_super) {
    __extends(Container, _super);
    function Container(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-container',
            components: [],
        }, _this.config);
        _this.componentsToAdd = [];
        _this.componentsToRemove = [];
        return _this;
    }
    /**
     * Adds a child component to the container.
     * @param component the component to add
     */
    Container.prototype.addComponent = function (component) {
        this.config.components.push(component);
        this.componentsToAdd.push(component);
    };
    /**
     * Removes a child component from the container.
     * @param component the component to remove
     * @returns {boolean} true if the component has been removed, false if it is not contained in this container
     */
    Container.prototype.removeComponent = function (component) {
        if (arrayutils_1.ArrayUtils.remove(this.config.components, component) != null) {
            this.componentsToRemove.push(component);
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * Gets an array of all child components in this container.
     * @returns {Component<ComponentConfig>[]}
     */
    Container.prototype.getComponents = function () {
        return this.config.components;
    };
    /**
     * Removes all child components from the container.
     */
    Container.prototype.removeComponents = function () {
        for (var _i = 0, _a = this.getComponents().slice(); _i < _a.length; _i++) {
            var component = _a[_i];
            this.removeComponent(component);
        }
    };
    /**
     * Updates the DOM of the container with the current components.
     */
    Container.prototype.updateComponents = function () {
        /* We cannot just clear the container to remove all elements and then re-add those that should stay, because
         * IE looses the innerHTML of unattached elements, leading to empty elements within the container (e.g. missing
         * subtitle text in SubtitleLabel).
         * Instead, we keep a list of elements to add and remove, leaving remaining elements alone. By keeping them in
         * the DOM, their content gets preserved in all browsers.
         */
        var component;
        while (component = this.componentsToRemove.shift()) {
            component.getDomElement().remove();
        }
        while (component = this.componentsToAdd.shift()) {
            this.innerContainerElement.append(component.getDomElement());
        }
    };
    Container.prototype.toDomElement = function () {
        // Create the container element (the outer <div>)
        var containerElement = new dom_1.DOM(this.config.tag, {
            'id': this.config.id,
            'class': this.getCssClasses(),
        });
        // Create the inner container element (the inner <div>) that will contain the components
        var innerContainer = new dom_1.DOM(this.config.tag, {
            'class': this.prefixCss('container-wrapper'),
        });
        this.innerContainerElement = innerContainer;
        for (var _i = 0, _a = this.config.components; _i < _a.length; _i++) {
            var initialComponent = _a[_i];
            this.componentsToAdd.push(initialComponent);
        }
        this.updateComponents();
        containerElement.append(innerContainer);
        return containerElement;
    };
    return Container;
}(component_1.Component));
exports.Container = Container;
},{"../arrayutils":1,"../dom":75,"./component":18}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var uiutils_1 = require("../uiutils");
var spacer_1 = require("./spacer");
/**
 * A container for main player control components, e.g. play toggle button, seek bar, volume control, fullscreen toggle
 * button.
 */
var ControlBar = /** @class */ (function (_super) {
    __extends(ControlBar, _super);
    function ControlBar(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-controlbar',
            hidden: true,
        }, _this.config);
        return _this;
    }
    ControlBar.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        // Counts how many components are hovered and block hiding of the control bar
        var hoverStackCount = 0;
        // Track hover status of child components
        uiutils_1.UIUtils.traverseTree(this, function (component) {
            // Do not track hover status of child containers or spacers, only of 'real' controls
            if (component instanceof container_1.Container || component instanceof spacer_1.Spacer) {
                return;
            }
            // Subscribe hover event and keep a count of the number of hovered children
            component.onHoverChanged.subscribe(function (sender, args) {
                if (args.hovered) {
                    hoverStackCount++;
                }
                else {
                    hoverStackCount--;
                }
            });
        });
        uimanager.onControlsShow.subscribe(function () {
            _this.show();
        });
        uimanager.onPreviewControlsHide.subscribe(function (sender, args) {
            // Cancel the hide event if hovered child components block hiding
            args.cancel = (hoverStackCount > 0);
        });
        uimanager.onControlsHide.subscribe(function () {
            _this.hide();
        });
    };
    return ControlBar;
}(container_1.Container));
exports.ControlBar = ControlBar;
},{"../uiutils":88,"./container":19,"./spacer":46}],21:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var label_1 = require("./label");
var tvnoisecanvas_1 = require("./tvnoisecanvas");
var errorutils_1 = require("../errorutils");
/**
 * Overlays the player and displays error messages.
 */
var ErrorMessageOverlay = /** @class */ (function (_super) {
    __extends(ErrorMessageOverlay, _super);
    function ErrorMessageOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.errorLabel = new label_1.Label({ cssClass: 'ui-errormessage-label' });
        _this.tvNoiseBackground = new tvnoisecanvas_1.TvNoiseCanvas();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-errormessage-overlay',
            components: [_this.tvNoiseBackground, _this.errorLabel],
            hidden: true,
        }, _this.config);
        return _this;
    }
    ErrorMessageOverlay.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        player.on(player.exports.PlayerEvent.Error, function (event) {
            var message = errorutils_1.ErrorUtils.defaultErrorMessageTranslator(event);
            // errorMessages configured in `UIConfig` take precedence `ErrorMessageOverlayConfig`
            var errorMessages = uimanager.getConfig().errorMessages || config.messages;
            // Process message translations
            if (errorMessages) {
                if (typeof errorMessages === 'function') {
                    // Translation function for all errors
                    message = errorMessages(event);
                }
                else if (errorMessages[event.code]) {
                    // It's not a translation function, so it must be a map of strings or translation functions
                    var customMessage = errorMessages[event.code];
                    if (typeof customMessage === 'string') {
                        message = customMessage;
                    }
                    else {
                        // The message is a translation function, so we call it
                        message = customMessage(event);
                    }
                }
            }
            // this.errorLabel.setText(message);
            // this.tvNoiseBackground.start();
            // this.show();
            // Lucas
            var modal = document.getElementById('modalMensagem');
            var modalPlayer = document.getElementsByClassName('myModal')[0];
            if (message !== undefined) {
                modal.classList.toggle('hidden', false);
                var customTelecineMensagem = document.getElementById('mensagemCustomizada');
                customTelecineMensagem.innerHTML = message;
                modalPlayer.classList.toggle('hidden', true);
                // player.destroy();
                // this.errorLabel.setText(message);
                // this.errorLabel.show();
                // this.tvNoiseBackground.start();
            }
            else {
                // let customErrorMsgTeste = document.getElementsByClassName('container')[0];
                modalPlayer.classList.toggle('hidden', false);
            }
            _this.show();
            // this.errorLabel.setText(message);
            // this.tvNoiseBackground.start();
            // this.show();
        });
        player.on(player.exports.PlayerEvent.SourceLoaded, function (event) {
            if (_this.isShown()) {
                _this.tvNoiseBackground.stop();
                _this.hide();
            }
        });
    };
    ErrorMessageOverlay.prototype.release = function () {
        _super.prototype.release.call(this);
        // Canvas rendering must be explicitly stopped, else it just continues forever and hogs resources
        this.tvNoiseBackground.stop();
    };
    return ErrorMessageOverlay;
}(container_1.Container));
exports.ErrorMessageOverlay = ErrorMessageOverlay;
},{"../errorutils":76,"./container":19,"./label":26,"./tvnoisecanvas":66}],22:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles the player between windowed and fullscreen view.
 */
var FullscreenToggleButton = /** @class */ (function (_super) {
    __extends(FullscreenToggleButton, _super);
    function FullscreenToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-fullscreentogglebutton',
            text: 'Fullscreen',
        }, _this.config);
        return _this;
    }
    FullscreenToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var fullscreenStateHandler = function () {
            if (player.getViewMode() === player.exports.ViewMode.Fullscreen) {
                _this.on();
            }
            else {
                _this.off();
            }
        };
        player.on(player.exports.PlayerEvent.ViewModeChanged, fullscreenStateHandler);
        this.onClick.subscribe(function () {
            if (player.getViewMode() === player.exports.ViewMode.Fullscreen) {
                player.setViewMode(player.exports.ViewMode.Inline);
            }
            else {
                player.setViewMode(player.exports.ViewMode.Fullscreen);
            }
        });
        // Startup init
        fullscreenStateHandler();
    };
    return FullscreenToggleButton;
}(togglebutton_1.ToggleButton));
exports.FullscreenToggleButton = FullscreenToggleButton;
},{"./togglebutton":65}],23:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var playbacktogglebutton_1 = require("./playbacktogglebutton");
var dom_1 = require("../dom");
/**
 * A button that overlays the video and toggles between playback and pause.
 */
var HugePlaybackToggleButton = /** @class */ (function (_super) {
    __extends(HugePlaybackToggleButton, _super);
    function HugePlaybackToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-hugeplaybacktogglebutton',
            text: 'Play/Pause',
        }, _this.config);
        return _this;
    }
    HugePlaybackToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        // Update button state through API events
        _super.prototype.configure.call(this, player, uimanager, false);
        var togglePlayback = function () {
            if (player.isPlaying() || _this.isPlayInitiated) {
                player.pause('ui');
            }
            else {
                player.play('ui');
            }
        };
        var toggleFullscreen = function () {
            if (player.getViewMode() === player.exports.ViewMode.Fullscreen) {
                player.setViewMode(player.exports.ViewMode.Inline);
            }
            else {
                player.setViewMode(player.exports.ViewMode.Fullscreen);
            }
        };
        var firstPlay = true;
        var clickTime = 0;
        var doubleClickTime = 0;
        /*
         * YouTube-style toggle button handling
         *
         * The goal is to prevent a short pause or playback interval between a click, that toggles playback, and a
         * double click, that toggles fullscreen. In this naive approach, the first click would e.g. start playback,
         * the second click would be detected as double click and toggle to fullscreen, and as second normal click stop
         * playback, which results is a short playback interval with max length of the double click detection
         * period (usually 500ms).
         *
         * To solve this issue, we defer handling of the first click for 200ms, which is almost unnoticeable to the user,
         * and just toggle playback if no second click (double click) has been registered during this period. If a double
         * click is registered, we just toggle the fullscreen. In the first 200ms, undesired playback changes thus cannot
         * happen. If a double click is registered within 500ms, we undo the playback change and switch fullscreen mode.
         * In the end, this method basically introduces a 200ms observing interval in which playback changes are prevented
         * if a double click happens.
         */
        this.onClick.subscribe(function () {
            // Directly start playback on first click of the button.
            // This is a required workaround for mobile browsers where video playback needs to be triggered directly
            // by the user. A deferred playback start through the timeout below is not considered as user action and
            // therefore ignored by mobile browsers.
            if (firstPlay) {
                // Try to start playback. Then we wait for Play and only when it arrives, we disable the firstPlay flag.
                // If we disable the flag here, onClick was triggered programmatically instead of by a user interaction, and
                // playback is blocked (e.g. on mobile devices due to the programmatic play() call), we loose the chance to
                // ever start playback through a user interaction again with this button.
                togglePlayback();
                return;
            }
            var now = Date.now();
            if (now - clickTime < 200) {
                // We have a double click inside the 200ms interval, just toggle fullscreen mode
                toggleFullscreen();
                doubleClickTime = now;
                return;
            }
            else if (now - clickTime < 500) {
                // We have a double click inside the 500ms interval, undo playback toggle and toggle fullscreen mode
                toggleFullscreen();
                togglePlayback();
                doubleClickTime = now;
                return;
            }
            clickTime = now;
            setTimeout(function () {
                if (Date.now() - doubleClickTime > 200) {
                    // No double click detected, so we toggle playback and wait what happens next
                    togglePlayback();
                }
            }, 200);
        });
        player.on(player.exports.PlayerEvent.Play, function () {
            // Playback has really started, we can disable the flag to switch to normal toggle button handling
            firstPlay = false;
        });
        player.on(player.exports.PlayerEvent.Warning, function (event) {
            if (event.code === player.exports.WarningCode.PLAYBACK_COULD_NOT_BE_STARTED) {
                // if playback could not be started, reset the first play flag as we need the user interaction to start
                firstPlay = true;
            }
        });
        var suppressPlayButtonTransitionAnimation = function () {
            // Disable the current animation
            _this.setTransitionAnimationsEnabled(false);
            // Enable the transition animations for the next state change
            _this.onToggle.subscribeOnce(function () {
                _this.setTransitionAnimationsEnabled(true);
            });
        };
        // Hide the play button animation when the UI is loaded (it should only be animated on state changes)
        suppressPlayButtonTransitionAnimation();
        var isAutoplayEnabled = player.getConfig().playback && Boolean(player.getConfig().playback.autoplay);
        // We only know if an autoplay attempt is upcoming if the player is not yet ready. It the player is already ready,
        // the attempt might be upcoming or might have already happened, but we don't have to handle that because we can
        // simply rely on isPlaying and the play state events.
        var isAutoplayUpcoming = !player.getSource() && isAutoplayEnabled;
        // Hide the play button when the player is already playing or autoplay is upcoming
        if (player.isPlaying() || isAutoplayUpcoming) {
            // Hide the play button (switch to playing state)
            this.on();
            // Disable the animation of the playing state switch
            suppressPlayButtonTransitionAnimation();
            // Show the play button without an animation if a play attempt is blocked
            player.on(player.exports.PlayerEvent.Warning, function (event) {
                if (event.code === player.exports.WarningCode.PLAYBACK_COULD_NOT_BE_STARTED) {
                    suppressPlayButtonTransitionAnimation();
                }
            });
        }
    };
    HugePlaybackToggleButton.prototype.toDomElement = function () {
        var buttonElement = _super.prototype.toDomElement.call(this);
        // Add child that contains the play button image
        // Setting the image directly on the button does not work together with scaling animations, because the button
        // can cover the whole video player are and scaling would extend it beyond. By adding an inner element, confined
        // to the size if the image, it can scale inside the player without overshooting.
        buttonElement.append(new dom_1.DOM('div', {
            'class': this.prefixCss('image'),
        }));
        return buttonElement;
    };
    /**
     * Enables or disables the play state transition animations of the play button image. Can be used to suppress
     * animations.
     * @param {boolean} enabled true to enable the animations (default), false to disable them
     */
    HugePlaybackToggleButton.prototype.setTransitionAnimationsEnabled = function (enabled) {
        var noTransitionAnimationsClass = this.prefixCss('no-transition-animations');
        if (enabled) {
            this.getDomElement().removeClass(noTransitionAnimationsClass);
        }
        else if (!this.getDomElement().hasClass(noTransitionAnimationsClass)) {
            this.getDomElement().addClass(noTransitionAnimationsClass);
        }
    };
    return HugePlaybackToggleButton;
}(playbacktogglebutton_1.PlaybackToggleButton));
exports.HugePlaybackToggleButton = HugePlaybackToggleButton;
},{"../dom":75,"./playbacktogglebutton":33}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("./button");
var dom_1 = require("../dom");
/**
 * A button to play/replay a video.
 */
var HugeReplayButton = /** @class */ (function (_super) {
    __extends(HugeReplayButton, _super);
    function HugeReplayButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-hugereplaybutton',
            text: 'Replay',
        }, _this.config);
        return _this;
    }
    HugeReplayButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            player.play('ui');
        });
    };
    HugeReplayButton.prototype.toDomElement = function () {
        var buttonElement = _super.prototype.toDomElement.call(this);
        // Add child that contains the play button image
        // Setting the image directly on the button does not work together with scaling animations, because the button
        // can cover the whole video player are and scaling would extend it beyond. By adding an inner element, confined
        // to the size if the image, it can scale inside the player without overshooting.
        buttonElement.append(new dom_1.DOM('div', {
            'class': this.prefixCss('image'),
        }));
        return buttonElement;
    };
    return HugeReplayButton;
}(button_1.Button));
exports.HugeReplayButton = HugeReplayButton;
},{"../dom":75,"./button":12}],25:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var listselector_1 = require("./listselector");
var dom_1 = require("../dom");
var ItemSelectionList = /** @class */ (function (_super) {
    __extends(ItemSelectionList, _super);
    function ItemSelectionList(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            tag: 'ul',
            cssClass: 'ui-itemselectionlist',
        }, _this.config);
        return _this;
    }
    ItemSelectionList.prototype.isActive = function () {
        return this.items.length > 1;
    };
    ItemSelectionList.prototype.toDomElement = function () {
        var listElement = new dom_1.DOM('ul', {
            'id': this.config.id,
            'class': this.getCssClasses(),
        });
        this.listElement = listElement;
        this.updateDomItems();
        return listElement;
    };
    ItemSelectionList.prototype.updateDomItems = function (selectedValue) {
        var _this = this;
        if (selectedValue === void 0) { selectedValue = null; }
        // Delete all children
        this.listElement.empty();
        var selectedListItem = null;
        var selectItem = function (listItem) {
            listItem.addClass(_this.prefixCss(ItemSelectionList.CLASS_SELECTED));
        };
        var deselectItem = function (listItem) {
            listItem.removeClass(_this.prefixCss(ItemSelectionList.CLASS_SELECTED));
        };
        var _loop_1 = function (item) {
            var listItem = new dom_1.DOM('li', {
                'type': 'li',
                'class': this_1.prefixCss('ui-selectionlistitem'),
            }).append(new dom_1.DOM('a', {}).html(item.label));
            if (!selectedListItem) {
                if (selectedValue == null) { // If there is no pre-selected value, select the first one
                    selectedListItem = listItem;
                }
                else if (String(selectedValue) === item.key) { // convert selectedValue to string to catch 'null'/null case
                    selectedListItem = listItem;
                }
            }
            // Handle list item selections
            listItem.on('click', function () {
                // Deselect the previous item (if there was a selected item)
                if (selectedListItem) {
                    deselectItem(selectedListItem);
                }
                // Select the clicked item
                selectedListItem = listItem;
                selectItem(listItem);
                // Fire the event
                _this.onItemSelectedEvent(item.key, false);
            });
            // Select default item
            if (selectedListItem) {
                selectItem(selectedListItem);
            }
            this_1.listElement.append(listItem);
        };
        var this_1 = this;
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            _loop_1(item);
        }
    };
    ItemSelectionList.prototype.onItemAddedEvent = function (value) {
        _super.prototype.onItemAddedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    ItemSelectionList.prototype.onItemRemovedEvent = function (value) {
        _super.prototype.onItemRemovedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    ItemSelectionList.prototype.onItemSelectedEvent = function (value, updateDomItems) {
        if (updateDomItems === void 0) { updateDomItems = true; }
        _super.prototype.onItemSelectedEvent.call(this, value);
        if (updateDomItems) {
            this.updateDomItems(value);
        }
    };
    ItemSelectionList.CLASS_SELECTED = 'selected';
    return ItemSelectionList;
}(listselector_1.ListSelector));
exports.ItemSelectionList = ItemSelectionList;
},{"../dom":75,"./listselector":28}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A simple text label.
 *
 * DOM example:
 * <code>
 *     <span class='ui-label'>...some text...</span>
 * </code>
 */
var Label = /** @class */ (function (_super) {
    __extends(Label, _super);
    function Label(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.labelEvents = {
            onClick: new eventdispatcher_1.EventDispatcher(),
            onTextChanged: new eventdispatcher_1.EventDispatcher(),
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-label',
        }, _this.config);
        _this.text = _this.config.text;
        return _this;
    }
    Label.prototype.toDomElement = function () {
        var _this = this;
        var labelElement = new dom_1.DOM('span', {
            'id': this.config.id,
            'class': this.getCssClasses(),
        }).html(this.text);
        labelElement.on('click', function () {
            _this.onClickEvent();
        });
        return labelElement;
    };
    /**
     * Set the text on this label.
     * @param text
     */
    Label.prototype.setText = function (text) {
        if (text === this.text) {
            return;
        }
        this.text = text;
        this.getDomElement().html(text);
        this.onTextChangedEvent(text);
    };
    /**
     * Gets the text on this label.
     * @return {string} The text on the label
     */
    Label.prototype.getText = function () {
        return this.text;
    };
    /**
     * Clears the text on this label.
     */
    Label.prototype.clearText = function () {
        this.getDomElement().html('');
        this.onTextChangedEvent(null);
    };
    /**
     * Tests if the label is empty and does not contain any text.
     * @return {boolean} True if the label is empty, else false
     */
    Label.prototype.isEmpty = function () {
        return !this.text;
    };
    /**
     * Fires the {@link #onClick} event.
     * Can be used by subclasses to listen to this event without subscribing an event listener by overwriting the method
     * and calling the super method.
     */
    Label.prototype.onClickEvent = function () {
        this.labelEvents.onClick.dispatch(this);
    };
    /**
     * Fires the {@link #onClick} event.
     * Can be used by subclasses to listen to this event without subscribing an event listener by overwriting the method
     * and calling the super method.
     */
    Label.prototype.onTextChangedEvent = function (text) {
        this.labelEvents.onTextChanged.dispatch(this, text);
    };
    Object.defineProperty(Label.prototype, "onClick", {
        /**
         * Gets the event that is fired when the label is clicked.
         * @returns {Event<Label<LabelConfig>, NoArgs>}
         */
        get: function () {
            return this.labelEvents.onClick.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Label.prototype, "onTextChanged", {
        /**
         * Gets the event that is fired when the text on the label is changed.
         * @returns {Event<Label<LabelConfig>, string>}
         */
        get: function () {
            return this.labelEvents.onTextChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return Label;
}(component_1.Component));
exports.Label = Label;
},{"../dom":75,"../eventdispatcher":77,"./component":18}],27:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
var listselector_1 = require("./listselector");
var dom_1 = require("../dom");
/**
 * A element to select a single item out of a list of available items.
 *
 * DOM example:
 * <code>
 *   <div class='ui-listbox'>
 *     <button class='ui-listbox-button'>label</button>
 *     ...
 *   </div
 * </code>
 */
var ListBox = /** @class */ (function (_super) {
    __extends(ListBox, _super);
    function ListBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-listbox',
        }, _this.config);
        return _this;
    }
    ListBox.prototype.toDomElement = function () {
        var listBoxElement = new dom_1.DOM('div', {
            'id': this.config.id,
            'class': this.getCssClasses(),
        });
        this.listBoxElement = listBoxElement;
        this.updateDomItems();
        return listBoxElement;
    };
    ListBox.prototype.updateDomItems = function (selectedValue) {
        var _this = this;
        if (selectedValue === void 0) { selectedValue = null; }
        // Delete all children
        this.listBoxElement.empty();
        // Add updated children
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var itemButton = new ListBoxItemButton({
                key: item.key,
                text: item.label,
            });
            itemButton.onClick.subscribe(function (sender) {
                _this.handleSelectionChange(sender);
            });
            // These buttons are not in the component tree
            // see comment: https://github.com/bitmovin/bitmovin-player-ui/pull/122#discussion_r201958260
            var itemElement = itemButton.getDomElement();
            // convert selectedValue and item.key to string to catch 'null'/null case
            if (String(item.key) === String(selectedValue)) {
                itemButton.on();
            }
            this.listBoxElement.append(itemElement);
        }
    };
    ListBox.prototype.handleSelectionChange = function (sender) {
        this.onItemSelectedEvent(sender.key);
    };
    ListBox.prototype.onItemAddedEvent = function (value) {
        _super.prototype.onItemAddedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    ListBox.prototype.onItemRemovedEvent = function (value) {
        _super.prototype.onItemRemovedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    ListBox.prototype.onItemSelectedEvent = function (value, updateDomItems) {
        if (updateDomItems === void 0) { updateDomItems = true; }
        _super.prototype.onItemSelectedEvent.call(this, value);
        if (updateDomItems) {
            this.updateDomItems(value);
        }
    };
    return ListBox;
}(listselector_1.ListSelector));
exports.ListBox = ListBox;
var ListBoxItemButton = /** @class */ (function (_super) {
    __extends(ListBoxItemButton, _super);
    function ListBoxItemButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-listbox-button',
            onClass: 'selected',
            offClass: '',
        }, _this.config);
        return _this;
    }
    Object.defineProperty(ListBoxItemButton.prototype, "key", {
        get: function () {
            return this.config.key;
        },
        enumerable: true,
        configurable: true
    });
    return ListBoxItemButton;
}(togglebutton_1.ToggleButton));
},{"../dom":75,"./listselector":28,"./togglebutton":65}],28:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var eventdispatcher_1 = require("../eventdispatcher");
var arrayutils_1 = require("../arrayutils");
var ListSelector = /** @class */ (function (_super) {
    __extends(ListSelector, _super);
    function ListSelector(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.listSelectorEvents = {
            onItemAdded: new eventdispatcher_1.EventDispatcher(),
            onItemRemoved: new eventdispatcher_1.EventDispatcher(),
            onItemSelected: new eventdispatcher_1.EventDispatcher(),
        };
        _this.config = _this.mergeConfig(config, {
            items: [],
            cssClass: 'ui-listselector',
        }, _this.config);
        _this.items = _this.config.items;
        return _this;
    }
    ListSelector.prototype.getItemIndex = function (key) {
        for (var index in this.items) {
            if (key === this.items[index].key) {
                return parseInt(index);
            }
        }
        return -1;
    };
    /**
     * Checks if the specified item is part of this selector.
     * @param key the key of the item to check
     * @returns {boolean} true if the item is part of this selector, else false
     */
    ListSelector.prototype.hasItem = function (key) {
        return this.getItemIndex(key) > -1;
    };
    /**
     * Adds an item to this selector by appending it to the end of the list of items. If an item with the specified
     * key already exists, it is replaced.
     * @param key the key of the item to add
     * @param label the (human-readable) label of the item to add
     */
    ListSelector.prototype.addItem = function (key, label) {
        var listItem = { key: key, label: label };
        // Apply filter function
        if (this.config.filter && !this.config.filter(listItem)) {
            return;
        }
        // Apply translator function
        if (this.config.translator) {
            listItem.label = this.config.translator(listItem);
        }
        this.removeItem(key); // Try to remove key first to get overwrite behavior and avoid duplicate keys
        this.items.push(listItem);
        this.onItemAddedEvent(key);
    };
    /**
     * Removes an item from this selector.
     * @param key the key of the item to remove
     * @returns {boolean} true if removal was successful, false if the item is not part of this selector
     */
    ListSelector.prototype.removeItem = function (key) {
        var index = this.getItemIndex(key);
        if (index > -1) {
            arrayutils_1.ArrayUtils.remove(this.items, this.items[index]);
            this.onItemRemovedEvent(key);
            return true;
        }
        return false;
    };
    /**
     * Selects an item from the items in this selector.
     * @param key the key of the item to select
     * @returns {boolean} true is the selection was successful, false if the selected item is not part of the selector
     */
    ListSelector.prototype.selectItem = function (key) {
        if (key === this.selectedItem) {
            // itemConfig is already selected, suppress any further action
            return true;
        }
        var index = this.getItemIndex(key);
        if (index > -1) {
            this.selectedItem = key;
            this.onItemSelectedEvent(key);
            return true;
        }
        return false;
    };
    /**
     * Returns the key of the selected item.
     * @returns {string} the key of the selected item or null if no item is selected
     */
    ListSelector.prototype.getSelectedItem = function () {
        return this.selectedItem;
    };
    /**
     * Removes all items from this selector.
     */
    ListSelector.prototype.clearItems = function () {
        // local copy for iteration after clear
        var items = this.items;
        // clear items
        this.items = [];
        // clear the selection as the selected item is also removed
        this.selectedItem = null;
        // fire events
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            this.onItemRemovedEvent(item.key);
        }
    };
    /**
     * Returns the number of items in this selector.
     * @returns {number}
     */
    ListSelector.prototype.itemCount = function () {
        return Object.keys(this.items).length;
    };
    ListSelector.prototype.onItemAddedEvent = function (key) {
        this.listSelectorEvents.onItemAdded.dispatch(this, key);
    };
    ListSelector.prototype.onItemRemovedEvent = function (key) {
        this.listSelectorEvents.onItemRemoved.dispatch(this, key);
    };
    ListSelector.prototype.onItemSelectedEvent = function (key) {
        this.listSelectorEvents.onItemSelected.dispatch(this, key);
    };
    Object.defineProperty(ListSelector.prototype, "onItemAdded", {
        /**
         * Gets the event that is fired when an item is added to the list of items.
         * @returns {Event<ListSelector<Config>, string>}
         */
        get: function () {
            return this.listSelectorEvents.onItemAdded.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListSelector.prototype, "onItemRemoved", {
        /**
         * Gets the event that is fired when an item is removed from the list of items.
         * @returns {Event<ListSelector<Config>, string>}
         */
        get: function () {
            return this.listSelectorEvents.onItemRemoved.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListSelector.prototype, "onItemSelected", {
        /**
         * Gets the event that is fired when an item is selected from the list of items.
         * @returns {Event<ListSelector<Config>, string>}
         */
        get: function () {
            return this.listSelectorEvents.onItemSelected.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return ListSelector;
}(component_1.Component));
exports.ListSelector = ListSelector;
},{"../arrayutils":1,"../eventdispatcher":77,"./component":18}],29:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var label_1 = require("./label");
/**
 * Enumerates the types of content that the {@link MetadataLabel} can display.
 */
var MetadataLabelContent;
(function (MetadataLabelContent) {
    /**
     * Title of the data source.
     */
    MetadataLabelContent[MetadataLabelContent["Title"] = 0] = "Title";
    /**
     * Description fo the data source.
     */
    MetadataLabelContent[MetadataLabelContent["Description"] = 1] = "Description";
})(MetadataLabelContent = exports.MetadataLabelContent || (exports.MetadataLabelContent = {}));
/**
 * A label that can be configured to display certain metadata.
 */
var MetadataLabel = /** @class */ (function (_super) {
    __extends(MetadataLabel, _super);
    function MetadataLabel(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['label-metadata', 'label-metadata-' + MetadataLabelContent[config.content].toLowerCase()],
        }, _this.config);
        return _this;
    }
    MetadataLabel.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        var uiconfig = uimanager.getConfig();
        var init = function () {
            switch (config.content) {
                case MetadataLabelContent.Title:
                    _this.setText(uiconfig.metadata.title);
                    break;
                case MetadataLabelContent.Description:
                    _this.setText(uiconfig.metadata.description);
                    break;
            }
        };
        var unload = function () {
            _this.setText(null);
        };
        // Init label
        init();
        // Clear labels when source is unloaded
        player.on(player.exports.PlayerEvent.SourceUnloaded, unload);
        uimanager.getConfig().events.onUpdated.subscribe(init);
    };
    return MetadataLabel;
}(label_1.Label));
exports.MetadataLabel = MetadataLabel;
},{"./label":26}],30:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles Apple macOS picture-in-picture mode.
 */
var PictureInPictureToggleButton = /** @class */ (function (_super) {
    __extends(PictureInPictureToggleButton, _super);
    function PictureInPictureToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-piptogglebutton',
            text: 'Picture-in-Picture',
        }, _this.config);
        return _this;
    }
    PictureInPictureToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            if (player.isViewModeAvailable(player.exports.ViewMode.PictureInPicture)) {
                if (player.getViewMode() === player.exports.ViewMode.PictureInPicture) {
                    player.setViewMode(player.exports.ViewMode.Inline);
                }
                else {
                    player.setViewMode(player.exports.ViewMode.PictureInPicture);
                }
            }
            else {
                if (console) {
                    console.log('PIP unavailable');
                }
            }
        });
        var pipAvailableHander = function () {
            if (player.isViewModeAvailable(player.exports.ViewMode.PictureInPicture)) {
                _this.show();
            }
            else {
                _this.hide();
            }
        };
        uimanager.getConfig().events.onUpdated.subscribe(pipAvailableHander);
        // Toggle button 'on' state
        player.on(player.exports.PlayerEvent.ViewModeChanged, function () {
            if (player.getViewMode() === player.exports.ViewMode.PictureInPicture) {
                _this.on();
            }
            else {
                _this.off();
            }
        });
        // Startup init
        pipAvailableHander(); // Hide button if PIP not available
        if (player.getViewMode() === player.exports.ViewMode.PictureInPicture) {
            this.on();
        }
    };
    return PictureInPictureToggleButton;
}(togglebutton_1.ToggleButton));
exports.PictureInPictureToggleButton = PictureInPictureToggleButton;
},{"./togglebutton":65}],31:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection of different playback speeds.
 */
var PlaybackSpeedSelectBox = /** @class */ (function (_super) {
    __extends(PlaybackSpeedSelectBox, _super);
    function PlaybackSpeedSelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.defaultPlaybackSpeeds = [0.25, 0.5, 1, 1.5, 2];
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-playbackspeedselectbox'],
        }, _this.config);
        return _this;
    }
    PlaybackSpeedSelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addDefaultItems();
        this.onItemSelected.subscribe(function (sender, value) {
            player.setPlaybackSpeed(parseFloat(value));
            _this.selectItem(value);
        });
        var setDefaultValue = function () {
            var playbackSpeed = player.getPlaybackSpeed();
            _this.setSpeed(playbackSpeed);
        };
        player.on(player.exports.PlayerEvent.PlaybackSpeedChanged, setDefaultValue);
        uimanager.getConfig().events.onUpdated.subscribe(setDefaultValue);
    };
    PlaybackSpeedSelectBox.prototype.setSpeed = function (speed) {
        if (!this.selectItem(String(speed))) {
            // a playback speed was set which is not in the list, add it to the list to show it to the user
            this.clearItems();
            this.addDefaultItems([speed]);
            this.selectItem(String(speed));
        }
    };
    PlaybackSpeedSelectBox.prototype.addDefaultItems = function (customItems) {
        var _this = this;
        if (customItems === void 0) { customItems = []; }
        var sortedSpeeds = this.defaultPlaybackSpeeds.concat(customItems).sort();
        sortedSpeeds.forEach(function (element) {
            if (element !== 1) {
                _this.addItem(String(element), element + "x");
            }
            else {
                _this.addItem(String(element), 'Normal');
            }
        });
    };
    PlaybackSpeedSelectBox.prototype.clearItems = function () {
        this.items = [];
        this.selectedItem = null;
    };
    return PlaybackSpeedSelectBox;
}(selectbox_1.SelectBox));
exports.PlaybackSpeedSelectBox = PlaybackSpeedSelectBox;
},{"./selectbox":38}],32:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var label_1 = require("./label");
var playerutils_1 = require("../playerutils");
var stringutils_1 = require("../stringutils");
var PlaybackTimeLabelMode;
(function (PlaybackTimeLabelMode) {
    PlaybackTimeLabelMode[PlaybackTimeLabelMode["CurrentTime"] = 0] = "CurrentTime";
    PlaybackTimeLabelMode[PlaybackTimeLabelMode["TotalTime"] = 1] = "TotalTime";
    PlaybackTimeLabelMode[PlaybackTimeLabelMode["CurrentAndTotalTime"] = 2] = "CurrentAndTotalTime";
})(PlaybackTimeLabelMode = exports.PlaybackTimeLabelMode || (exports.PlaybackTimeLabelMode = {}));
/**
 * A label that display the current playback time and the total time through {@link PlaybackTimeLabel#setTime setTime}
 * or any string through {@link PlaybackTimeLabel#setText setText}.
 */
var PlaybackTimeLabel = /** @class */ (function (_super) {
    __extends(PlaybackTimeLabel, _super);
    function PlaybackTimeLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-playbacktimelabel',
            timeLabelMode: PlaybackTimeLabelMode.CurrentAndTotalTime,
            hideInLivePlayback: false,
        }, _this.config);
        return _this;
    }
    PlaybackTimeLabel.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        var live = false;
        var liveCssClass = this.prefixCss('ui-playbacktimelabel-live');
        var liveEdgeCssClass = this.prefixCss('ui-playbacktimelabel-live-edge');
        var minWidth = 0;
        var liveClickHandler = function () {
            player.timeShift(0);
        };
        var updateLiveState = function () {
            // Player is playing a live stream when the duration is infinite
            live = player.isLive();
            // Attach/detach live marker class
            if (live) {
                _this.getDomElement().addClass(liveCssClass);
                _this.setText('Live');
                if (config.hideInLivePlayback) {
                    _this.hide();
                }
                _this.onClick.subscribe(liveClickHandler);
                updateLiveTimeshiftState();
            }
            else {
                _this.getDomElement().removeClass(liveCssClass);
                _this.getDomElement().removeClass(liveEdgeCssClass);
                _this.show();
                _this.onClick.unsubscribe(liveClickHandler);
            }
        };
        var updateLiveTimeshiftState = function () {
            if (!live) {
                return;
            }
            // The player is only at the live edge iff the stream is not shifted and it is actually playing or playback has
            // never been started (meaning it isn't paused). A player that is paused is always behind the live edge.
            // An exception is made for live streams without a timeshift window, because here we "stop" playback instead
            // of pausing it (from a UI perspective), so we keep the live edge indicator on because a play would always
            // resume at the live edge.
            var isTimeshifted = player.getTimeShift() < 0;
            var isTimeshiftAvailable = player.getMaxTimeShift() < 0;
            if (!isTimeshifted && (!player.isPaused() || !isTimeshiftAvailable)) {
                _this.getDomElement().addClass(liveEdgeCssClass);
            }
            else {
                _this.getDomElement().removeClass(liveEdgeCssClass);
            }
        };
        var liveStreamDetector = new playerutils_1.PlayerUtils.LiveStreamDetector(player, uimanager);
        liveStreamDetector.onLiveChanged.subscribe(function (sender, args) {
            live = args.live;
            updateLiveState();
        });
        liveStreamDetector.detect(); // Initial detection
        var playbackTimeHandler = function () {
            if (!live && player.getDuration() !== Infinity) {
                _this.setTime(player.getCurrentTime(), player.getDuration());
            }
            // To avoid 'jumping' in the UI by varying label sizes due to non-monospaced fonts,
            // we gradually increase the min-width with the content to reach a stable size.
            var width = _this.getDomElement().width();
            if (width > minWidth) {
                minWidth = width;
                _this.getDomElement().css({
                    'min-width': minWidth + 'px',
                });
            }
        };
        player.on(player.exports.PlayerEvent.TimeChanged, playbackTimeHandler);
        player.on(player.exports.PlayerEvent.Seeked, playbackTimeHandler);
        player.on(player.exports.PlayerEvent.TimeShift, updateLiveTimeshiftState);
        player.on(player.exports.PlayerEvent.TimeShifted, updateLiveTimeshiftState);
        player.on(player.exports.PlayerEvent.Play, updateLiveTimeshiftState);
        player.on(player.exports.PlayerEvent.Paused, updateLiveTimeshiftState);
        var init = function () {
            // Reset min-width when a new source is ready (especially for switching VOD/Live modes where the label content
            // changes)
            minWidth = 0;
            _this.getDomElement().css({
                'min-width': null,
            });
            // Set time format depending on source duration
            _this.timeFormat = Math.abs(player.isLive() ? player.getMaxTimeShift() : player.getDuration()) >= 3600 ?
                stringutils_1.StringUtils.FORMAT_HHMMSS : stringutils_1.StringUtils.FORMAT_MMSS;
            // Update time after the format has been set
            playbackTimeHandler();
        };
        uimanager.getConfig().events.onUpdated.subscribe(init);
        init();
    };
    /**
     * Sets the current playback time and total duration.
     * @param playbackSeconds the current playback time in seconds
     * @param durationSeconds the total duration in seconds
     */
    PlaybackTimeLabel.prototype.setTime = function (playbackSeconds, durationSeconds) {
        var currentTime = stringutils_1.StringUtils.secondsToTime(playbackSeconds, this.timeFormat);
        var totalTime = stringutils_1.StringUtils.secondsToTime(durationSeconds, this.timeFormat);
        switch (this.config.timeLabelMode) {
            case PlaybackTimeLabelMode.CurrentTime:
                this.setText("" + currentTime);
                break;
            case PlaybackTimeLabelMode.TotalTime:
                this.setText("" + totalTime);
                break;
            case PlaybackTimeLabelMode.CurrentAndTotalTime:
                this.setText(currentTime + " / " + totalTime);
                break;
        }
    };
    /**
     * Sets the current time format
     * @param timeFormat the time format
     */
    PlaybackTimeLabel.prototype.setTimeFormat = function (timeFormat) {
        this.timeFormat = timeFormat;
    };
    return PlaybackTimeLabel;
}(label_1.Label));
exports.PlaybackTimeLabel = PlaybackTimeLabel;
},{"../playerutils":81,"../stringutils":83,"./label":26}],33:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
var playerutils_1 = require("../playerutils");
/**
 * A button that toggles between playback and pause.
 */
var PlaybackToggleButton = /** @class */ (function (_super) {
    __extends(PlaybackToggleButton, _super);
    function PlaybackToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-playbacktogglebutton',
            text: 'Play/Pause',
        }, _this.config);
        _this.isPlayInitiated = false;
        return _this;
    }
    PlaybackToggleButton.prototype.configure = function (player, uimanager, handleClickEvent) {
        var _this = this;
        if (handleClickEvent === void 0) { handleClickEvent = true; }
        _super.prototype.configure.call(this, player, uimanager);
        var isSeeking = false;
        // Handler to update button state based on player state
        var playbackStateHandler = function () {
            // If the UI is currently seeking, playback is temporarily stopped but the buttons should
            // not reflect that and stay as-is (e.g indicate playback while seeking).
            if (isSeeking) {
                return;
            }
            if (player.isPlaying() || _this.isPlayInitiated) {
                _this.on();
            }
            else {
                _this.off();
            }
        };
        // Call handler upon these events
        player.on(player.exports.PlayerEvent.Play, function (e) {
            _this.isPlayInitiated = true;
            playbackStateHandler();
        });
        player.on(player.exports.PlayerEvent.Paused, function (e) {
            _this.isPlayInitiated = false;
            playbackStateHandler();
        });
        player.on(player.exports.PlayerEvent.Playing, function (e) {
            _this.isPlayInitiated = false;
            playbackStateHandler();
        });
        // after unloading + loading a new source, the player might be in a different playing state (from playing into stopped)
        player.on(player.exports.PlayerEvent.SourceLoaded, playbackStateHandler);
        uimanager.getConfig().events.onUpdated.subscribe(playbackStateHandler);
        player.on(player.exports.PlayerEvent.SourceUnloaded, playbackStateHandler);
        // when playback finishes, player turns to paused mode
        player.on(player.exports.PlayerEvent.PlaybackFinished, playbackStateHandler);
        player.on(player.exports.PlayerEvent.CastStarted, playbackStateHandler);
        // When a playback attempt is rejected with warning 5008, we switch the button state back to off
        // This is required for blocked autoplay, because there is no Paused event in such case
        player.on(player.exports.PlayerEvent.Warning, function (event) {
            if (event.code === player.exports.WarningCode.PLAYBACK_COULD_NOT_BE_STARTED) {
                _this.isPlayInitiated = false;
                _this.off();
            }
        });
        // Detect absence of timeshifting on live streams and add tagging class to convert button icons to play/stop
        var timeShiftDetector = new playerutils_1.PlayerUtils.TimeShiftAvailabilityDetector(player);
        timeShiftDetector.onTimeShiftAvailabilityChanged.subscribe(function (sender, args) {
            if (!args.timeShiftAvailable) {
                _this.getDomElement().addClass(_this.prefixCss(PlaybackToggleButton.CLASS_STOPTOGGLE));
            }
            else {
                _this.getDomElement().removeClass(_this.prefixCss(PlaybackToggleButton.CLASS_STOPTOGGLE));
            }
        });
        timeShiftDetector.detect(); // Initial detection
        if (handleClickEvent) {
            // Control player by button events
            // When a button event triggers a player API call, events are fired which in turn call the event handler
            // above that updated the button state.
            this.onClick.subscribe(function () {
                if (player.isPlaying() || _this.isPlayInitiated) {
                    player.pause('ui');
                }
                else {
                    player.play('ui');
                }
            });
        }
        // Track UI seeking status
        uimanager.onSeek.subscribe(function () {
            isSeeking = true;
        });
        uimanager.onSeeked.subscribe(function () {
            isSeeking = false;
        });
        // Startup init
        playbackStateHandler();
    };
    PlaybackToggleButton.CLASS_STOPTOGGLE = 'stoptoggle';
    return PlaybackToggleButton;
}(togglebutton_1.ToggleButton));
exports.PlaybackToggleButton = PlaybackToggleButton;
},{"../playerutils":81,"./togglebutton":65}],34:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var hugeplaybacktogglebutton_1 = require("./hugeplaybacktogglebutton");
/**
 * Overlays the player and displays error messages.
 */
var PlaybackToggleOverlay = /** @class */ (function (_super) {
    __extends(PlaybackToggleOverlay, _super);
    function PlaybackToggleOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.playbackToggleButton = new hugeplaybacktogglebutton_1.HugePlaybackToggleButton();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-playbacktoggle-overlay',
            components: [_this.playbackToggleButton],
        }, _this.config);
        return _this;
    }
    return PlaybackToggleOverlay;
}(container_1.Container));
exports.PlaybackToggleOverlay = PlaybackToggleOverlay;
},{"./container":19,"./hugeplaybacktogglebutton":23}],35:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var component_1 = require("./component");
var dom_1 = require("../dom");
var stringutils_1 = require("../stringutils");
var hugereplaybutton_1 = require("./hugereplaybutton");
/**
 * Overlays the player and displays recommended videos.
 */
var RecommendationOverlay = /** @class */ (function (_super) {
    __extends(RecommendationOverlay, _super);
    function RecommendationOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.replayButton = new hugereplaybutton_1.HugeReplayButton();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-recommendation-overlay',
            hidden: true,
            components: [_this.replayButton],
        }, _this.config);
        return _this;
    }
    RecommendationOverlay.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var clearRecommendations = function () {
            for (var _i = 0, _a = _this.getComponents().slice(); _i < _a.length; _i++) {
                var component = _a[_i];
                if (component instanceof RecommendationItem) {
                    _this.removeComponent(component);
                }
            }
            _this.updateComponents();
            _this.getDomElement().removeClass(_this.prefixCss('recommendations'));
        };
        var setupRecommendations = function () {
            clearRecommendations();
            var recommendations = uimanager.getConfig().recommendations;
            if (recommendations.length > 0) {
                var index = 1;
                for (var _i = 0, recommendations_1 = recommendations; _i < recommendations_1.length; _i++) {
                    var item = recommendations_1[_i];
                    _this.addComponent(new RecommendationItem({
                        itemConfig: item,
                        cssClasses: ['recommendation-item-' + (index++)],
                    }));
                }
                _this.updateComponents(); // create container DOM elements
                _this.getDomElement().addClass(_this.prefixCss('recommendations'));
            }
        };
        uimanager.getConfig().events.onUpdated.subscribe(setupRecommendations);
        // Remove recommendations and hide overlay when source is unloaded
        player.on(player.exports.PlayerEvent.SourceUnloaded, function () {
            clearRecommendations();
            _this.hide();
        });
        // Display recommendations when playback has finished
        player.on(player.exports.PlayerEvent.PlaybackFinished, function () {
            _this.show();
        });
        // Hide recommendations when playback starts, e.g. a restart
        player.on(player.exports.PlayerEvent.Play, function () {
            _this.hide();
        });
        // Init on startup
        setupRecommendations();
    };
    return RecommendationOverlay;
}(container_1.Container));
exports.RecommendationOverlay = RecommendationOverlay;
/**
 * An item of the {@link RecommendationOverlay}. Used only internally in {@link RecommendationOverlay}.
 */
var RecommendationItem = /** @class */ (function (_super) {
    __extends(RecommendationItem, _super);
    function RecommendationItem(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-recommendation-item',
            itemConfig: null,
        }, _this.config);
        return _this;
    }
    RecommendationItem.prototype.toDomElement = function () {
        var config = this.config.itemConfig; // TODO fix generics and get rid of cast
        var itemElement = new dom_1.DOM('a', {
            'id': this.config.id,
            'class': this.getCssClasses(),
            'href': config.url,
        }).css({ 'background-image': "url(" + config.thumbnail + ")" });
        var bgElement = new dom_1.DOM('div', {
            'class': this.prefixCss('background'),
        });
        itemElement.append(bgElement);
        var titleElement = new dom_1.DOM('span', {
            'class': this.prefixCss('title'),
        }).append(new dom_1.DOM('span', {
            'class': this.prefixCss('innertitle'),
        }).html(config.title));
        itemElement.append(titleElement);
        var timeElement = new dom_1.DOM('span', {
            'class': this.prefixCss('duration'),
        }).append(new dom_1.DOM('span', {
            'class': this.prefixCss('innerduration'),
        }).html(config.duration ? stringutils_1.StringUtils.secondsToTime(config.duration) : ''));
        itemElement.append(timeElement);
        return itemElement;
    };
    return RecommendationItem;
}(component_1.Component));
},{"../dom":75,"../stringutils":83,"./component":18,"./container":19,"./hugereplaybutton":24}],36:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
var timeout_1 = require("../timeout");
var playerutils_1 = require("../playerutils");
/**
 * A seek bar to seek within the player's media. It displays the current playback position, amount of buffed data, seek
 * target, and keeps status about an ongoing seek.
 *
 * The seek bar displays different 'bars':
 *  - the playback position, i.e. the position in the media at which the player current playback pointer is positioned
 *  - the buffer position, which usually is the playback position plus the time span that is already buffered ahead
 *  - the seek position, used to preview to where in the timeline a seek will jump to
 */
var SeekBar = /** @class */ (function (_super) {
    __extends(SeekBar, _super);
    function SeekBar(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        /**
         * Buffer of the the current playback position. The position must be buffered in case the element
         * needs to be refreshed with {@link #refreshPlaybackPosition}.
         * @type {number}
         */
        _this.playbackPositionPercentage = 0;
        // https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
        _this.touchSupported = ('ontouchstart' in window);
        _this.seekBarEvents = {
            /**
             * Fired when a scrubbing seek operation is started.
             */
            onSeek: new eventdispatcher_1.EventDispatcher(),
            /**
             * Fired during a scrubbing seek to indicate that the seek preview (i.e. the video frame) should be updated.
             */
            onSeekPreview: new eventdispatcher_1.EventDispatcher(),
            /**
             * Fired when a scrubbing seek has finished or when a direct seek is issued.
             */
            onSeeked: new eventdispatcher_1.EventDispatcher(),
        };
        _this.seekWhileScrubbing = function (sender, args) {
            if (args.scrubbing) {
                _this.seek(args.position);
            }
        };
        _this.seek = function (percentage) {
            if (_this.player.isLive()) {
                var maxTimeShift = _this.player.getMaxTimeShift();
                _this.player.timeShift(maxTimeShift - (maxTimeShift * (percentage / 100)), 'ui');
            }
            else {
                _this.player.seek(_this.player.getDuration() * (percentage / 100), 'ui');
            }
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-seekbar',
            vertical: false,
            smoothPlaybackPositionUpdateIntervalMs: 50,
        }, _this.config);
        _this.label = _this.config.label;
        _this.timelineMarkers = [];
        return _this;
    }
    SeekBar.prototype.initialize = function () {
        _super.prototype.initialize.call(this);
        if (this.hasLabel()) {
            this.getLabel().initialize();
        }
    };
    SeekBar.prototype.configure = function (player, uimanager, configureSeek) {
        var _this = this;
        if (configureSeek === void 0) { configureSeek = true; }
        _super.prototype.configure.call(this, player, uimanager);
        this.player = player;
        // Apply scaling transform to the backdrop bar to have all bars rendered similarly
        // (the call must be up here to be executed for the volume slider as well)
        this.setPosition(this.seekBarBackdrop, 100);
        if (!configureSeek) {
            // The configureSeek flag can be used by subclasses to disable configuration as seek bar. E.g. the volume
            // slider is reusing this component but adds its own functionality, and does not need the seek functionality.
            // This is actually a hack, the proper solution would be for both seek bar and volume sliders to extend
            // a common base slider component and implement their functionality there.
            return;
        }
        var isPlaying = false;
        var isUserSeeking = false;
        var isPlayerSeeking = false;
        // Update playback and buffer positions
        var playbackPositionHandler = function (event, forceUpdate) {
            if (event === void 0) { event = null; }
            if (forceUpdate === void 0) { forceUpdate = false; }
            if (isUserSeeking) {
                // We caught a seek preview seek, do not update the seekbar
                return;
            }
            if (player.isLive()) {
                if (player.getMaxTimeShift() === 0) {
                    // This case must be explicitly handled to avoid division by zero
                    _this.setPlaybackPosition(100);
                }
                else {
                    var playbackPositionPercentage = 100 - (100 / player.getMaxTimeShift() * player.getTimeShift());
                    _this.setPlaybackPosition(playbackPositionPercentage);
                }
                // Always show full buffer for live streams
                _this.setBufferPosition(100);
            }
            else {
                var playbackPositionPercentage = 100 / player.getDuration() * player.getCurrentTime();
                var videoBufferLength = player.getVideoBufferLength();
                var audioBufferLength = player.getAudioBufferLength();
                // Calculate the buffer length which is the smaller length of the audio and video buffers. If one of these
                // buffers is not available, we set it's value to MAX_VALUE to make sure that the other real value is taken
                // as the buffer length.
                var bufferLength = Math.min(videoBufferLength != null ? videoBufferLength : Number.MAX_VALUE, audioBufferLength != null ? audioBufferLength : Number.MAX_VALUE);
                // If both buffer lengths are missing, we set the buffer length to zero
                if (bufferLength === Number.MAX_VALUE) {
                    bufferLength = 0;
                }
                var bufferPercentage = 100 / player.getDuration() * bufferLength;
                // Update playback position only in paused state or in the initial startup state where player is neither
                // paused nor playing. Playback updates are handled in the Timeout below.
                if (_this.config.smoothPlaybackPositionUpdateIntervalMs === SeekBar.SMOOTH_PLAYBACK_POSITION_UPDATE_DISABLED
                    || forceUpdate || player.isPaused() || (player.isPaused() === player.isPlaying())) {
                    _this.setPlaybackPosition(playbackPositionPercentage);
                }
                _this.setBufferPosition(playbackPositionPercentage + bufferPercentage);
            }
        };
        // Update seekbar upon these events
        // init playback position when the player is ready
        player.on(player.exports.PlayerEvent.Ready, playbackPositionHandler);
        // update playback position when it changes
        player.on(player.exports.PlayerEvent.TimeChanged, playbackPositionHandler);
        // update bufferlevel when buffering is complete
        player.on(player.exports.PlayerEvent.StallEnded, playbackPositionHandler);
        // update playback position when a seek has finished
        player.on(player.exports.PlayerEvent.Seeked, playbackPositionHandler);
        // update playback position when a timeshift has finished
        player.on(player.exports.PlayerEvent.TimeShifted, playbackPositionHandler);
        // update bufferlevel when a segment has been downloaded
        player.on(player.exports.PlayerEvent.SegmentRequestFinished, playbackPositionHandler);
        this.configureLivePausedTimeshiftUpdater(player, uimanager, playbackPositionHandler);
        // Seek handling
        var onPlayerSeek = function () {
            isPlayerSeeking = true;
            _this.setSeeking(true);
        };
        var onPlayerSeeked = function () {
            isPlayerSeeking = false;
            _this.setSeeking(false);
        };
        var restorePlayingState = function () {
            // Continue playback after seek if player was playing when seek started
            if (isPlaying) {
                // use the same issuer here as in the pause on seek
                player.play('ui-seek');
            }
        };
        player.on(player.exports.PlayerEvent.Seek, onPlayerSeek);
        player.on(player.exports.PlayerEvent.Seeked, onPlayerSeeked);
        player.on(player.exports.PlayerEvent.TimeShift, onPlayerSeek);
        player.on(player.exports.PlayerEvent.TimeShifted, onPlayerSeeked);
        this.onSeek.subscribe(function (sender) {
            isUserSeeking = true; // track seeking status so we can catch events from seek preview seeks
            // Notify UI manager of started seek
            uimanager.onSeek.dispatch(sender);
            // Save current playback state before performing the seek
            if (!isPlayerSeeking) {
                isPlaying = player.isPlaying();
                // Pause playback while seeking
                if (isPlaying) {
                    // use a different issuer here, as play/pause on seek is not "really" triggerd by the user
                    player.pause('ui-seek');
                }
            }
        });
        this.onSeekPreview.subscribe(function (sender, args) {
            // Notify UI manager of seek preview
            uimanager.onSeekPreview.dispatch(sender, args);
        });
        // Rate-limited scrubbing seek
        this.onSeekPreview.subscribeRateLimited(this.seekWhileScrubbing, 200);
        this.onSeeked.subscribe(function (sender, percentage) {
            isUserSeeking = false;
            // Do the seek
            _this.seek(percentage);
            // Notify UI manager of finished seek
            uimanager.onSeeked.dispatch(sender);
            // Continue playback after seek if player was playing when seek started
            restorePlayingState();
        });
        if (this.hasLabel()) {
            // Configure a seekbar label that is internal to the seekbar)
            this.getLabel().configure(player, uimanager);
        }
        // Hide seekbar for live sources without timeshift
        var isLive = false;
        var hasTimeShift = false;
        var switchVisibility = function (isLive, hasTimeShift) {
            if (isLive && !hasTimeShift) {
                _this.hide();
            }
            else {
                _this.show();
            }
            playbackPositionHandler(null, true);
            _this.refreshPlaybackPosition();
        };
        var liveStreamDetector = new playerutils_1.PlayerUtils.LiveStreamDetector(player, uimanager);
        liveStreamDetector.onLiveChanged.subscribe(function (sender, args) {
            isLive = args.live;
            switchVisibility(isLive, hasTimeShift);
        });
        var timeShiftDetector = new playerutils_1.PlayerUtils.TimeShiftAvailabilityDetector(player);
        timeShiftDetector.onTimeShiftAvailabilityChanged.subscribe(function (sender, args) {
            hasTimeShift = args.timeShiftAvailable;
            switchVisibility(isLive, hasTimeShift);
        });
        // Initial detection
        liveStreamDetector.detect();
        timeShiftDetector.detect();
        // Refresh the playback position when the player resized or the UI is configured. The playback position marker
        // is positioned absolutely and must therefore be updated when the size of the seekbar changes.
        player.on(player.exports.PlayerEvent.PlayerResized, function () {
            _this.refreshPlaybackPosition();
        });
        // Additionally, when this code is called, the seekbar is not part of the UI yet and therefore does not have a size,
        // resulting in a wrong initial position of the marker. Refreshing it once the UI is configured solved this issue.
        uimanager.onConfigured.subscribe(function () {
            _this.refreshPlaybackPosition();
        });
        // It can also happen when a new source is loaded
        player.on(player.exports.PlayerEvent.SourceLoaded, function () {
            _this.refreshPlaybackPosition();
        });
        // Add markers when a source is loaded or update when a marker is added or removed
        uimanager.getConfig().events.onUpdated.subscribe(function () {
            playbackPositionHandler();
        });
        // Initialize seekbar
        playbackPositionHandler(); // Set the playback position
        this.setBufferPosition(0);
        this.setSeekPosition(0);
        if (this.config.smoothPlaybackPositionUpdateIntervalMs !== SeekBar.SMOOTH_PLAYBACK_POSITION_UPDATE_DISABLED) {
            this.configureSmoothPlaybackPositionUpdater(player, uimanager);
        }
        this.configureMarkers(player, uimanager);
    };
    /**
     * Update seekbar while a live stream with DVR window is paused.
     * The playback position stays still and the position indicator visually moves towards the back.
     */
    SeekBar.prototype.configureLivePausedTimeshiftUpdater = function (player, uimanager, playbackPositionHandler) {
        var _this = this;
        // Regularly update the playback position while the timeout is active
        this.pausedTimeshiftUpdater = new timeout_1.Timeout(1000, playbackPositionHandler, true);
        // Start updater when a live stream with timeshift window is paused
        player.on(player.exports.PlayerEvent.Paused, function () {
            if (player.isLive() && player.getMaxTimeShift() < 0) {
                _this.pausedTimeshiftUpdater.start();
            }
        });
        // Stop updater when playback continues (no matter if the updater was started before)
        player.on(player.exports.PlayerEvent.Play, function () { return _this.pausedTimeshiftUpdater.clear(); });
    };
    SeekBar.prototype.configureSmoothPlaybackPositionUpdater = function (player, uimanager) {
        var _this = this;
        /*
         * Playback position update
         *
         * We do not update the position directly from the TimeChanged event, because it arrives very jittery and
         * results in a jittery position indicator since the CSS transition time is statically set.
         * To work around this issue, we maintain a local playback position that is updated in a stable regular interval
         * and kept in sync with the player.
         */
        var currentTimeSeekBar = 0;
        var currentTimePlayer = 0;
        var updateIntervalMs = 50;
        var currentTimeUpdateDeltaSecs = updateIntervalMs / 1000;
        this.smoothPlaybackPositionUpdater = new timeout_1.Timeout(updateIntervalMs, function () {
            currentTimeSeekBar += currentTimeUpdateDeltaSecs;
            try {
                currentTimePlayer = player.getCurrentTime();
            }
            catch (error) {
                // Detect if the player has been destroyed and stop updating if so
                if (error instanceof player.exports.PlayerAPINotAvailableError) {
                    _this.smoothPlaybackPositionUpdater.clear();
                }
                // If the current time cannot be read it makes no sense to continue
                return;
            }
            // Sync currentTime of seekbar to player
            var currentTimeDelta = currentTimeSeekBar - currentTimePlayer;
            // If the delta is larger that 2 secs, directly jump the seekbar to the
            // player time instead of smoothly fast forwarding/rewinding.
            if (Math.abs(currentTimeDelta) > 2) {
                currentTimeSeekBar = currentTimePlayer;
            }
            // If currentTimeDelta is negative and below the adjustment threshold,
            // the player is ahead of the seekbar and we 'fast forward' the seekbar
            else if (currentTimeDelta <= -currentTimeUpdateDeltaSecs) {
                currentTimeSeekBar += currentTimeUpdateDeltaSecs;
            }
            // If currentTimeDelta is positive and above the adjustment threshold,
            // the player is behind the seekbar and we 'rewind' the seekbar
            else if (currentTimeDelta >= currentTimeUpdateDeltaSecs) {
                currentTimeSeekBar -= currentTimeUpdateDeltaSecs;
            }
            var playbackPositionPercentage = 100 / player.getDuration() * currentTimeSeekBar;
            _this.setPlaybackPosition(playbackPositionPercentage);
        }, true);
        var startSmoothPlaybackPositionUpdater = function () {
            if (!player.isLive()) {
                currentTimeSeekBar = player.getCurrentTime();
                _this.smoothPlaybackPositionUpdater.start();
            }
        };
        var stopSmoothPlaybackPositionUpdater = function () {
            _this.smoothPlaybackPositionUpdater.clear();
        };
        player.on(player.exports.PlayerEvent.Play, startSmoothPlaybackPositionUpdater);
        player.on(player.exports.PlayerEvent.Playing, startSmoothPlaybackPositionUpdater);
        player.on(player.exports.PlayerEvent.Paused, stopSmoothPlaybackPositionUpdater);
        player.on(player.exports.PlayerEvent.PlaybackFinished, stopSmoothPlaybackPositionUpdater);
        player.on(player.exports.PlayerEvent.Seeked, function () {
            currentTimeSeekBar = player.getCurrentTime();
        });
        player.on(player.exports.PlayerEvent.SourceUnloaded, stopSmoothPlaybackPositionUpdater);
        if (player.isPlaying()) {
            startSmoothPlaybackPositionUpdater();
        }
    };
    SeekBar.prototype.configureMarkers = function (player, uimanager) {
        var _this = this;
        var clearMarkers = function () {
            _this.timelineMarkers = [];
            _this.updateMarkers();
        };
        var setupMarkers = function () {
            clearMarkers();
            var duration = player.getDuration();
            if (duration === Infinity) {
                // Don't generate timeline markers if we don't yet have a duration
                // The duration check is for buggy platforms where the duration is not available instantly (Chrome on Android 4.3)
                return;
            }
            for (var _i = 0, _a = uimanager.getConfig().metadata.markers; _i < _a.length; _i++) {
                var marker = _a[_i];
                var markerPosition = 100 / duration * marker.time; // convert absolute time to percentage
                var markerDuration = 100 / duration * marker.duration;
                _this.timelineMarkers.push({ marker: marker, position: markerPosition, duration: markerDuration });
            }
            // Populate the timeline with the markers
            _this.updateMarkers();
        };
        // Remove markers when unloaded
        player.on(player.exports.PlayerEvent.SourceUnloaded, clearMarkers);
        // Update markers when the size of the seekbar changes
        player.on(player.exports.PlayerEvent.PlayerResized, function () { return _this.updateMarkers(); });
        uimanager.getConfig().events.onUpdated.subscribe(setupMarkers);
        uimanager.onRelease.subscribe(function () { return uimanager.getConfig().events.onUpdated.unsubscribe(setupMarkers); });
        // Init markers at startup
        setupMarkers();
    };
    SeekBar.prototype.release = function () {
        _super.prototype.release.call(this);
        if (this.smoothPlaybackPositionUpdater) { // object must not necessarily exist, e.g. in volume slider subclass
            this.smoothPlaybackPositionUpdater.clear();
        }
        if (this.pausedTimeshiftUpdater) {
            this.pausedTimeshiftUpdater.clear();
        }
        this.onSeekPreview.unsubscribe(this.seekWhileScrubbing);
    };
    SeekBar.prototype.toDomElement = function () {
        var _this = this;
        if (this.config.vertical) {
            this.config.cssClasses.push('vertical');
        }
        var seekBarContainer = new dom_1.DOM('div', {
            'id': this.config.id,
            'class': this.getCssClasses(),
        });
        var seekBar = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar'),
        });
        this.seekBar = seekBar;
        // Indicator that shows the buffer fill level
        var seekBarBufferLevel = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-bufferlevel'),
        });
        this.seekBarBufferPosition = seekBarBufferLevel;
        // Indicator that shows the current playback position
        var seekBarPlaybackPosition = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-playbackposition'),
        });
        this.seekBarPlaybackPosition = seekBarPlaybackPosition;
        // A marker of the current playback position, e.g. a dot or line
        var seekBarPlaybackPositionMarker = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-playbackposition-marker'),
        });
        this.seekBarPlaybackPositionMarker = seekBarPlaybackPositionMarker;
        // Indicator that show where a seek will go to
        var seekBarSeekPosition = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-seekposition'),
        });
        this.seekBarSeekPosition = seekBarSeekPosition;
        // Indicator that shows the full seekbar
        var seekBarBackdrop = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-backdrop'),
        });
        this.seekBarBackdrop = seekBarBackdrop;
        var seekBarChapterMarkersContainer = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-markers'),
        });
        this.seekBarMarkersContainer = seekBarChapterMarkersContainer;
        seekBar.append(this.seekBarBackdrop, this.seekBarBufferPosition, this.seekBarSeekPosition, this.seekBarPlaybackPosition, this.seekBarMarkersContainer, this.seekBarPlaybackPositionMarker);
        var seeking = false;
        // Define handler functions so we can attach/remove them later
        var mouseTouchMoveHandler = function (e) {
            e.preventDefault();
            // Avoid propagation to VR handler
            e.stopPropagation();
            var targetPercentage = 100 * _this.getOffset(e);
            _this.setSeekPosition(targetPercentage);
            _this.setPlaybackPosition(targetPercentage);
            _this.onSeekPreviewEvent(targetPercentage, true);
        };
        var mouseTouchUpHandler = function (e) {
            e.preventDefault();
            // Remove handlers, seek operation is finished
            new dom_1.DOM(document).off('touchmove mousemove', mouseTouchMoveHandler);
            new dom_1.DOM(document).off('touchend mouseup', mouseTouchUpHandler);
            var targetPercentage = 100 * _this.getOffset(e);
            var snappedChapter = _this.getMarkerAtPosition(targetPercentage);
            _this.setSeeking(false);
            seeking = false;
            // Fire seeked event
            _this.onSeekedEvent(snappedChapter ? snappedChapter.position : targetPercentage);
        };
        // A seek always start with a touchstart or mousedown directly on the seekbar.
        // To track a mouse seek also outside the seekbar (for touch events this works automatically),
        // so the user does not need to take care that the mouse always stays on the seekbar, we attach the mousemove
        // and mouseup handlers to the whole document. A seek is triggered when the user lifts the mouse key.
        // A seek mouse gesture is thus basically a click with a long time frame between down and up events.
        seekBar.on('touchstart mousedown', function (e) {
            var isTouchEvent = _this.touchSupported && e instanceof TouchEvent;
            // Prevent selection of DOM elements (also prevents mousedown if current event is touchstart)
            e.preventDefault();
            // Avoid propagation to VR handler
            e.stopPropagation();
            _this.setSeeking(true); // Set seeking class on DOM element
            seeking = true; // Set seek tracking flag
            // Fire seeked event
            _this.onSeekEvent();
            // Add handler to track the seek operation over the whole document
            new dom_1.DOM(document).on(isTouchEvent ? 'touchmove' : 'mousemove', mouseTouchMoveHandler);
            new dom_1.DOM(document).on(isTouchEvent ? 'touchend' : 'mouseup', mouseTouchUpHandler);
        });
        // Display seek target indicator when mouse hovers or finger slides over seekbar
        seekBar.on('touchmove mousemove', function (e) {
            e.preventDefault();
            if (seeking) {
                // During a seek (when mouse is down or touch move active), we need to stop propagation to avoid
                // the VR viewport reacting to the moves.
                e.stopPropagation();
                // Because the stopped propagation inhibits the event on the document, we need to call it from here
                mouseTouchMoveHandler(e);
            }
            var position = 100 * _this.getOffset(e);
            _this.setSeekPosition(position);
            _this.onSeekPreviewEvent(position, false);
            if (_this.hasLabel() && _this.getLabel().isHidden()) {
                _this.getLabel().show();
            }
        });
        // Hide seek target indicator when mouse or finger leaves seekbar
        seekBar.on('touchend mouseleave', function (e) {
            e.preventDefault();
            _this.setSeekPosition(0);
            if (_this.hasLabel()) {
                _this.getLabel().hide();
            }
        });
        seekBarContainer.append(seekBar);
        if (this.label) {
            seekBarContainer.append(this.label.getDomElement());
        }
        return seekBarContainer;
    };
    SeekBar.prototype.updateMarkers = function () {
        var _this = this;
        this.seekBarMarkersContainer.empty();
        var seekBarWidthPx = this.seekBar.width();
        for (var _i = 0, _a = this.timelineMarkers; _i < _a.length; _i++) {
            var marker = _a[_i];
            var markerClasses = ['seekbar-marker'].concat(marker.marker.cssClasses || [])
                .map(function (cssClass) { return _this.prefixCss(cssClass); });
            var cssProperties = {
                'width': marker.position + '%',
            };
            if (marker.duration > 0) {
                var markerWidthPx = Math.round(seekBarWidthPx / 100 * marker.duration);
                cssProperties['border-right-width'] = markerWidthPx + 'px';
                cssProperties['margin-left'] = '0';
            }
            this.seekBarMarkersContainer.append(new dom_1.DOM('div', {
                'class': markerClasses.join(' '),
                'data-marker-time': String(marker.marker.time),
                'data-marker-title': String(marker.marker.title),
            }).css(cssProperties));
        }
    };
    SeekBar.prototype.getMarkerAtPosition = function (percentage) {
        var snappingRange = 1;
        if (this.timelineMarkers.length > 0) {
            for (var _i = 0, _a = this.timelineMarkers; _i < _a.length; _i++) {
                var marker = _a[_i];
                // Handle interval markers
                if (marker.duration > 0
                    && percentage >= marker.position - snappingRange
                    && percentage <= marker.position + marker.duration + snappingRange) {
                    return marker;
                }
                // Handle position markers
                else if (percentage >= marker.position - snappingRange
                    && percentage <= marker.position + snappingRange) {
                    return marker;
                }
            }
        }
        return null;
    };
    /**
     * Gets the horizontal offset of a mouse/touch event point from the left edge of the seek bar.
     * @param eventPageX the pageX coordinate of an event to calculate the offset from
     * @returns {number} a number in the range of [0, 1], where 0 is the left edge and 1 is the right edge
     */
    SeekBar.prototype.getHorizontalOffset = function (eventPageX) {
        var elementOffsetPx = this.seekBar.offset().left;
        var widthPx = this.seekBar.width();
        var offsetPx = eventPageX - elementOffsetPx;
        var offset = 1 / widthPx * offsetPx;
        return this.sanitizeOffset(offset);
    };
    /**
     * Gets the vertical offset of a mouse/touch event point from the bottom edge of the seek bar.
     * @param eventPageY the pageX coordinate of an event to calculate the offset from
     * @returns {number} a number in the range of [0, 1], where 0 is the bottom edge and 1 is the top edge
     */
    SeekBar.prototype.getVerticalOffset = function (eventPageY) {
        var elementOffsetPx = this.seekBar.offset().top;
        var widthPx = this.seekBar.height();
        var offsetPx = eventPageY - elementOffsetPx;
        var offset = 1 / widthPx * offsetPx;
        return 1 - this.sanitizeOffset(offset);
    };
    /**
     * Gets the mouse or touch event offset for the current configuration (horizontal or vertical).
     * @param e the event to calculate the offset from
     * @returns {number} a number in the range of [0, 1]
     * @see #getHorizontalOffset
     * @see #getVerticalOffset
     */
    SeekBar.prototype.getOffset = function (e) {
        if (this.touchSupported && e instanceof TouchEvent) {
            if (this.config.vertical) {
                return this.getVerticalOffset(e.type === 'touchend' ? e.changedTouches[0].pageY : e.touches[0].pageY);
            }
            else {
                return this.getHorizontalOffset(e.type === 'touchend' ? e.changedTouches[0].pageX : e.touches[0].pageX);
            }
        }
        else if (e instanceof MouseEvent) {
            if (this.config.vertical) {
                return this.getVerticalOffset(e.pageY);
            }
            else {
                return this.getHorizontalOffset(e.pageX);
            }
        }
        else {
            if (console) {
                console.warn('invalid event');
            }
            return 0;
        }
    };
    /**
     * Sanitizes the mouse offset to the range of [0, 1].
     *
     * When tracking the mouse outside the seek bar, the offset can be outside the desired range and this method
     * limits it to the desired range. E.g. a mouse event left of the left edge of a seek bar yields an offset below
     * zero, but to display the seek target on the seek bar, we need to limit it to zero.
     *
     * @param offset the offset to sanitize
     * @returns {number} the sanitized offset.
     */
    SeekBar.prototype.sanitizeOffset = function (offset) {
        // Since we track mouse moves over the whole document, the target can be outside the seek range,
        // and we need to limit it to the [0, 1] range.
        if (offset < 0) {
            offset = 0;
        }
        else if (offset > 1) {
            offset = 1;
        }
        return offset;
    };
    /**
     * Sets the position of the playback position indicator.
     * @param percent a number between 0 and 100 as returned by the player
     */
    SeekBar.prototype.setPlaybackPosition = function (percent) {
        this.playbackPositionPercentage = percent;
        // Set position of the bar
        this.setPosition(this.seekBarPlaybackPosition, percent);
        // Set position of the marker
        var totalSize = (this.config.vertical ? (this.seekBar.height() - this.seekBarPlaybackPositionMarker.height()) : this.seekBar.width());
        var px = (totalSize) / 100 * percent;
        if (this.config.vertical) {
            px = this.seekBar.height() - px - this.seekBarPlaybackPositionMarker.height();
        }
        var style = this.config.vertical ?
            // -ms-transform required for IE9
            // -webkit-transform required for Android 4.4 WebView
            {
                'transform': 'translateY(' + px + 'px)',
                '-ms-transform': 'translateY(' + px + 'px)',
                '-webkit-transform': 'translateY(' + px + 'px)',
            } :
            {
                'transform': 'translateX(' + px + 'px)',
                '-ms-transform': 'translateX(' + px + 'px)',
                '-webkit-transform': 'translateX(' + px + 'px)',
            };
        this.seekBarPlaybackPositionMarker.css(style);
    };
    /**
     * Refreshes the playback position. Can be used by subclasses to refresh the position when
     * the size of the component changes.
     */
    SeekBar.prototype.refreshPlaybackPosition = function () {
        this.setPlaybackPosition(this.playbackPositionPercentage);
    };
    /**
     * Sets the position until which media is buffered.
     * @param percent a number between 0 and 100
     */
    SeekBar.prototype.setBufferPosition = function (percent) {
        this.setPosition(this.seekBarBufferPosition, percent);
    };
    /**
     * Sets the position where a seek, if executed, would jump to.
     * @param percent a number between 0 and 100
     */
    SeekBar.prototype.setSeekPosition = function (percent) {
        this.setPosition(this.seekBarSeekPosition, percent);
    };
    /**
     * Set the actual position (width or height) of a DOM element that represent a bar in the seek bar.
     * @param element the element to set the position for
     * @param percent a number between 0 and 100
     */
    SeekBar.prototype.setPosition = function (element, percent) {
        var scale = percent / 100;
        // When the scale is exactly 1 or very near 1 (and the browser internally rounds it to 1), browsers seem to render
        // the elements differently and the height gets slightly off, leading to mismatching heights when e.g. the buffer
        // level bar has a width of 1 and the playback position bar has a width < 1. A jittering buffer level around 1
        // leads to an even worse flickering effect.
        // Various changes in CSS styling and DOM hierarchy did not solve the issue so the workaround is to avoid a scale
        // of exactly 1.
        if (scale >= 0.99999 && scale <= 1.00001) {
            scale = 0.99999;
        }
        var style = this.config.vertical ?
            // -ms-transform required for IE9
            // -webkit-transform required for Android 4.4 WebView
            {
                'transform': 'scaleY(' + scale + ')',
                '-ms-transform': 'scaleY(' + scale + ')',
                '-webkit-transform': 'scaleY(' + scale + ')',
            } :
            {
                'transform': 'scaleX(' + scale + ')',
                '-ms-transform': 'scaleX(' + scale + ')',
                '-webkit-transform': 'scaleX(' + scale + ')',
            };
        element.css(style);
    };
    /**
     * Puts the seek bar into or out of seeking state by adding/removing a class to the DOM element. This can be used
     * to adjust the styling while seeking.
     *
     * @param seeking should be true when entering seek state, false when exiting the seek state
     */
    SeekBar.prototype.setSeeking = function (seeking) {
        if (seeking) {
            this.getDomElement().addClass(this.prefixCss(SeekBar.CLASS_SEEKING));
        }
        else {
            this.getDomElement().removeClass(this.prefixCss(SeekBar.CLASS_SEEKING));
        }
    };
    /**
     * Checks if the seek bar is currently in the seek state.
     * @returns {boolean} true if in seek state, else false
     */
    SeekBar.prototype.isSeeking = function () {
        return this.getDomElement().hasClass(this.prefixCss(SeekBar.CLASS_SEEKING));
    };
    /**
     * Checks if the seek bar has a {@link SeekBarLabel}.
     * @returns {boolean} true if the seek bar has a label, else false
     */
    SeekBar.prototype.hasLabel = function () {
        return this.label != null;
    };
    /**
     * Gets the label of this seek bar.
     * @returns {SeekBarLabel} the label if this seek bar has a label, else null
     */
    SeekBar.prototype.getLabel = function () {
        return this.label;
    };
    SeekBar.prototype.onSeekEvent = function () {
        this.seekBarEvents.onSeek.dispatch(this);
    };
    SeekBar.prototype.onSeekPreviewEvent = function (percentage, scrubbing) {
        var snappedMarker = this.getMarkerAtPosition(percentage);
        var seekPositionPercentage = percentage;
        if (snappedMarker) {
            if (snappedMarker.duration > 0) {
                if (percentage < snappedMarker.position) {
                    // Snap the position to the start of the interval if the seek is within the left snap margin
                    // We know that we are within a snap margin when we are outside the marker interval but still
                    // have a snappedMarker
                    seekPositionPercentage = snappedMarker.position;
                }
                else if (percentage > snappedMarker.position + snappedMarker.duration) {
                    // Snap the position to the end of the interval if the seek is within the right snap margin
                    seekPositionPercentage = snappedMarker.position + snappedMarker.duration;
                }
            }
            else {
                // Position markers always snap to their marker position
                seekPositionPercentage = snappedMarker.position;
            }
        }
        if (this.label) {
            this.label.getDomElement().css({
                'left': seekPositionPercentage + '%',
            });
        }
        this.seekBarEvents.onSeekPreview.dispatch(this, {
            scrubbing: scrubbing,
            position: seekPositionPercentage,
            marker: snappedMarker,
        });
    };
    SeekBar.prototype.onSeekedEvent = function (percentage) {
        this.seekBarEvents.onSeeked.dispatch(this, percentage);
    };
    Object.defineProperty(SeekBar.prototype, "onSeek", {
        /**
         * Gets the event that is fired when a scrubbing seek operation is started.
         * @returns {Event<SeekBar, NoArgs>}
         */
        get: function () {
            return this.seekBarEvents.onSeek.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SeekBar.prototype, "onSeekPreview", {
        /**
         * Gets the event that is fired during a scrubbing seek (to indicate that the seek preview, i.e. the video frame,
         * should be updated), or during a normal seek preview when the seek bar is hovered (and the seek target,
         * i.e. the seek bar label, should be updated).
         * @returns {Event<SeekBar, SeekPreviewEventArgs>}
         */
        get: function () {
            return this.seekBarEvents.onSeekPreview.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SeekBar.prototype, "onSeeked", {
        /**
         * Gets the event that is fired when a scrubbing seek has finished or when a direct seek is issued.
         * @returns {Event<SeekBar, number>}
         */
        get: function () {
            return this.seekBarEvents.onSeeked.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    SeekBar.prototype.onShowEvent = function () {
        _super.prototype.onShowEvent.call(this);
        // Refresh the position of the playback position when the seek bar becomes visible. To correctly set the position,
        // the DOM element must be fully initialized an have its size calculated, because the position is set as an absolute
        // value calculated from the size. This required size is not known when it is hidden.
        // For such cases, we refresh the position here in onShow because here it is guaranteed that the component knows
        // its size and can set the position correctly.
        this.refreshPlaybackPosition();
    };
    SeekBar.SMOOTH_PLAYBACK_POSITION_UPDATE_DISABLED = -1;
    /**
     * The CSS class that is added to the DOM element while the seek bar is in 'seeking' state.
     */
    SeekBar.CLASS_SEEKING = 'seeking';
    return SeekBar;
}(component_1.Component));
exports.SeekBar = SeekBar;
},{"../dom":75,"../eventdispatcher":77,"../playerutils":81,"../timeout":85,"./component":18}],37:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var label_1 = require("./label");
var component_1 = require("./component");
var stringutils_1 = require("../stringutils");
var imageloader_1 = require("../imageloader");
/**
 * A label for a {@link SeekBar} that can display the seek target time, a thumbnail, and title (e.g. chapter title).
 */
var SeekBarLabel = /** @class */ (function (_super) {
    __extends(SeekBarLabel, _super);
    function SeekBarLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.appliedMarkerCssClasses = [];
        _this.handleSeekPreview = function (sender, args) {
            if (_this.player.isLive()) {
                var maxTimeShift = _this.player.getMaxTimeShift();
                var time = maxTimeShift - maxTimeShift * (args.position / 100);
                _this.setTime(time);
            }
            else {
                if (args.marker) {
                    _this.setTitleText(args.marker.marker.title);
                }
                else {
                    _this.setTitleText(null);
                }
                var time = _this.player.getDuration() * (args.position / 100);
                _this.setTime(time);
                _this.setThumbnail(_this.player.getThumbnail(time));
            }
            // Remove CSS classes from previous marker
            if (_this.appliedMarkerCssClasses.length > 0) {
                _this.getDomElement().removeClass(_this.appliedMarkerCssClasses.join(' '));
                _this.appliedMarkerCssClasses = [];
            }
            // Add CSS classes of current marker
            if (args.marker) {
                var cssClasses = (args.marker.marker.cssClasses || []).map(function (cssClass) { return _this.prefixCss(cssClass); });
                _this.getDomElement().addClass(cssClasses.join(' '));
                _this.appliedMarkerCssClasses = cssClasses;
            }
        };
        _this.timeLabel = new label_1.Label({ cssClasses: ['seekbar-label-time'] });
        _this.titleLabel = new label_1.Label({ cssClasses: ['seekbar-label-title'] });
        _this.thumbnail = new component_1.Component({ cssClasses: ['seekbar-thumbnail'] });
        _this.thumbnailImageLoader = new imageloader_1.ImageLoader();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-seekbar-label',
            components: [new container_1.Container({
                    components: [
                        _this.thumbnail,
                        new container_1.Container({
                            components: [_this.titleLabel, _this.timeLabel],
                            cssClass: 'seekbar-label-metadata',
                        })
                    ],
                    cssClass: 'seekbar-label-inner',
                })],
            hidden: true,
        }, _this.config);
        return _this;
    }
    SeekBarLabel.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.player = player;
        this.uiManager = uimanager;
        uimanager.onSeekPreview.subscribeRateLimited(this.handleSeekPreview, 100);
        var init = function () {
            // Set time format depending on source duration
            _this.timeFormat = Math.abs(player.isLive() ? player.getMaxTimeShift() : player.getDuration()) >= 3600 ?
                stringutils_1.StringUtils.FORMAT_HHMMSS : stringutils_1.StringUtils.FORMAT_MMSS;
            // Set initial state of title and thumbnail to handle sourceLoaded when switching to a live-stream
            _this.setTitleText(null);
            _this.setThumbnail(null);
        };
        uimanager.getConfig().events.onUpdated.subscribe(init);
        init();
    };
    /**
     * Sets arbitrary text on the label.
     * @param text the text to show on the label
     */
    SeekBarLabel.prototype.setText = function (text) {
        this.timeLabel.setText(text);
    };
    /**
     * Sets a time to be displayed on the label.
     * @param seconds the time in seconds to display on the label
     */
    SeekBarLabel.prototype.setTime = function (seconds) {
        this.setText(stringutils_1.StringUtils.secondsToTime(seconds, this.timeFormat));
    };
    /**
     * Sets the text on the title label.
     * @param text the text to show on the label
     */
    SeekBarLabel.prototype.setTitleText = function (text) {
        this.titleLabel.setText(text);
    };
    /**
     * Sets or removes a thumbnail on the label.
     * @param thumbnail the thumbnail to display on the label or null to remove a displayed thumbnail
     */
    SeekBarLabel.prototype.setThumbnail = function (thumbnail) {
        var _this = this;
        if (thumbnail === void 0) { thumbnail = null; }
        var thumbnailElement = this.thumbnail.getDomElement();
        if (thumbnail == null) {
            thumbnailElement.css({
                'background-image': null,
                'display': null,
                'width': null,
                'height': null,
            });
        }
        else {
            if (thumbnail.url.indexOf('data:image/') > -1) {
                thumbnail.url = thumbnail.url.substring(thumbnail.url.indexOf('data:image/'));
            }
            // We use the thumbnail image loader to make sure the thumbnail is loaded and it's size is known before be can
            // calculate the CSS properties and set them on the element.
            this.thumbnailImageLoader.load(thumbnail.url, function (url, width, height) {
                // can be checked like that because x/y/w/h are either all present or none
                // https://www.w3.org/TR/media-frags/#naming-space
                if (thumbnail.x !== undefined) {
                    thumbnailElement.css(_this.thumbnailCssSprite(thumbnail, width, height));
                }
                else {
                    thumbnailElement.css(_this.thumbnailCssSingleImage(thumbnail, width, height));
                }
            });
        }
    };
    SeekBarLabel.prototype.thumbnailCssSprite = function (thumbnail, width, height) {
        var thumbnailCountX = width / thumbnail.width;
        var thumbnailCountY = height / thumbnail.height;
        var thumbnailIndexX = thumbnail.x / thumbnail.width;
        var thumbnailIndexY = thumbnail.y / thumbnail.height;
        var sizeX = 100 * thumbnailCountX;
        var sizeY = 100 * thumbnailCountY;
        var offsetX = 100 * thumbnailIndexX;
        var offsetY = 100 * thumbnailIndexY;
        var aspectRatio = 1 / thumbnail.width * thumbnail.height;
        // The thumbnail size is set by setting the CSS 'width' and 'padding-bottom' properties. 'padding-bottom' is
        // used because it is relative to the width and can be used to set the aspect ratio of the thumbnail.
        // A default value for width is set in the stylesheet and can be overwritten from there or anywhere else.
        return {
            'display': 'inherit',
            'background-image': "url(" + thumbnail.url + ")",
            'padding-bottom': 100 * aspectRatio + "%",
            'background-size': sizeX + "% " + sizeY + "%",
            'background-position': "-" + offsetX + "% -" + offsetY + "%",
        };
    };
    SeekBarLabel.prototype.thumbnailCssSingleImage = function (thumbnail, width, height) {
        var aspectRatio = 1 / width * height;
        return {
            'display': 'inherit',
            'background-image': "url(" + thumbnail.url + ")",
            'padding-bottom': 100 * aspectRatio + "%",
            'background-size': "100% 100%",
            'background-position': "0 0",
        };
    };
    SeekBarLabel.prototype.release = function () {
        _super.prototype.release.call(this);
        this.uiManager.onSeekPreview.unsubscribe(this.handleSeekPreview);
    };
    return SeekBarLabel;
}(container_1.Container));
exports.SeekBarLabel = SeekBarLabel;
},{"../imageloader":79,"../stringutils":83,"./component":18,"./container":19,"./label":26}],38:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var listselector_1 = require("./listselector");
var dom_1 = require("../dom");
/**
 * A simple select box providing the possibility to select a single item out of a list of available items.
 *
 * DOM example:
 * <code>
 *     <select class='ui-selectbox'>
 *         <option value='key'>label</option>
 *         ...
 *     </select>
 * </code>
 */
var SelectBox = /** @class */ (function (_super) {
    __extends(SelectBox, _super);
    function SelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-selectbox',
        }, _this.config);
        return _this;
    }
    SelectBox.prototype.toDomElement = function () {
        var _this = this;
        var selectElement = new dom_1.DOM('select', {
            'id': this.config.id,
            'class': this.getCssClasses(),
        });
        this.selectElement = selectElement;
        this.updateDomItems();
        selectElement.on('change', function () {
            var value = selectElement.val();
            _this.onItemSelectedEvent(value, false);
        });
        return selectElement;
    };
    SelectBox.prototype.updateDomItems = function (selectedValue) {
        if (selectedValue === void 0) { selectedValue = null; }
        // Delete all children
        this.selectElement.empty();
        // Add updated children
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var optionElement = new dom_1.DOM('option', {
                'value': String(item.key),
            }).html(item.label);
            if (item.key === String(selectedValue)) { // convert selectedValue to string to catch 'null'/null case
                optionElement.attr('selected', 'selected');
            }
            this.selectElement.append(optionElement);
        }
    };
    SelectBox.prototype.onItemAddedEvent = function (value) {
        _super.prototype.onItemAddedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    SelectBox.prototype.onItemRemovedEvent = function (value) {
        _super.prototype.onItemRemovedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    SelectBox.prototype.onItemSelectedEvent = function (value, updateDomItems) {
        if (updateDomItems === void 0) { updateDomItems = true; }
        _super.prototype.onItemSelectedEvent.call(this, value);
        if (updateDomItems) {
            this.updateDomItems(value);
        }
    };
    return SelectBox;
}(listselector_1.ListSelector));
exports.SelectBox = SelectBox;
},{"../dom":75,"./listselector":28}],39:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var selectbox_1 = require("./selectbox");
var timeout_1 = require("../timeout");
var eventdispatcher_1 = require("../eventdispatcher");
var settingspanelpage_1 = require("./settingspanelpage");
/**
 * A panel containing a list of {@link SettingsPanelPage items}.
 */
var SettingsPanel = /** @class */ (function (_super) {
    __extends(SettingsPanel, _super);
    function SettingsPanel(config) {
        var _this = _super.call(this, config) || this;
        // navigation handling
        _this.activePageIndex = 0;
        _this.navigationStack = [];
        _this.settingsPanelEvents = {
            onSettingsStateChanged: new eventdispatcher_1.EventDispatcher(),
        };
        // Tempo Container
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settings-panel',
            hideDelay: 3000,
            pageTransitionAnimation: true,
        }, _this.config);
        return _this;
    }
    SettingsPanel.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig(); // TODO fix generics type inference
        uimanager.onControlsHide.subscribe(function () { return _this.hideHoveredSelectBoxes(); });
        if (config.hideDelay > -1) {
            this.hideTimeout = new timeout_1.Timeout(config.hideDelay, function () {
                _this.hide();
                _this.hideHoveredSelectBoxes();
            });
            this.onShow.subscribe(function () {
                // Activate timeout when shown
                _this.hideTimeout.start();
            });
            this.getDomElement().on('mouseenter', function () {
                // On mouse enter clear the timeout
                _this.hideTimeout.clear();
            });
            this.getDomElement().on('mouseleave', function () {
                // On mouse leave activate the timeout
                _this.hideTimeout.reset();
            });
            this.onHide.subscribe(function () {
                // Clear timeout when hidden from outside
                _this.hideTimeout.clear();
                // Reset navigation
                _this.resetNavigation();
            });
        }
        // pass event from root page through
        this.getRootPage().onSettingsStateChanged.subscribe(function () {
            _this.onSettingsStateChangedEvent();
        });
        this.updateActivePageClass();
    };
    SettingsPanel.prototype.updateActivePageClass = function () {
        var _this = this;
        this.getPages().forEach(function (page, index) {
            if (index === _this.activePageIndex) {
                page.getDomElement().addClass(_this.prefixCss(SettingsPanel.CLASS_ACTIVE_PAGE));
            }
            else {
                page.getDomElement().removeClass(_this.prefixCss(SettingsPanel.CLASS_ACTIVE_PAGE));
            }
        });
    };
    SettingsPanel.prototype.setActivePageIndex = function (index) {
        var targetPage = this.getPages()[index];
        if (targetPage) {
            this.animateNavigation(targetPage);
            this.activePageIndex = index;
            this.navigationStack.push(targetPage);
            this.updateActivePageClass();
            targetPage.onActiveEvent();
        }
    };
    SettingsPanel.prototype.setActivePage = function (page) {
        var index = this.getPages().indexOf(page);
        this.setActivePageIndex(index);
    };
    SettingsPanel.prototype.popToRootSettingsPanelPage = function () {
        this.resetNavigation();
    };
    SettingsPanel.prototype.popSettingsPanelPage = function () {
        // pop one navigation item from stack
        var currentPage = this.navigationStack.pop(); // remove current page
        var targetPage = this.navigationStack[this.navigationStack.length - 1]; // pick target page without removing it
        if (targetPage) {
            this.setActivePage(targetPage);
        }
        else {
            // fallback to root
            this.popToRootSettingsPanelPage();
        }
        currentPage.onInactiveEvent();
    };
    SettingsPanel.prototype.resetNavigation = function () {
        var currentPage = this.navigationStack[this.navigationStack.length - 1];
        if (currentPage) {
            currentPage.onInactiveEvent();
        }
        this.navigationStack = [];
        this.activePageIndex = 0;
        this.animateNavigation(this.getRootPage());
        this.updateActivePageClass();
    };
    SettingsPanel.prototype.animateNavigation = function (targetPage) {
        if (!this.config.pageTransitionAnimation)
            return;
        // workaround to enable css transition for elements with auto width / height property
        // css transition does not work with auto properties by definition so we need to calculate 'real'
        // width / height values to have a nice looking animation
        var domElement = this.getDomElement();
        var htmlElement = domElement.get(0);
        // ensure container has real width / height (for first animation)
        if (htmlElement.style.width === '' || htmlElement.style.height === '') {
            domElement.css({
                'width': domElement.css('width'),
                'height': domElement.css('height'),
            });
        }
        var targetPageHtmlElement = targetPage.getDomElement().get(0);
        // clone the targetPage DOM element so that we can calculate the width / height how they will be after
        // switching the page. We are using a clone to prevent (mostly styling) side-effects on the real DOM element
        var clone = targetPageHtmlElement.cloneNode(true);
        // append to parent so we get the 'real' size
        var containerWrapper = targetPageHtmlElement.parentNode;
        containerWrapper.appendChild(clone);
        // set clone visible
        clone.style.display = 'block';
        var widthOffset = 0;
        var heightOffset = 0;
        // getComputedStyle will return values like '100px' so we need to extract the number
        var getNumberOfCss = function (value) {
            return Number(value.replace(/[^\d\.\-]/g, ''));
        };
        // to calculate final width / height of container we need to include the padding / margin as well
        var elementsWithMargins = [htmlElement, containerWrapper, targetPageHtmlElement];
        for (var _i = 0, elementsWithMargins_1 = elementsWithMargins; _i < elementsWithMargins_1.length; _i++) {
            var element = elementsWithMargins_1[_i];
            var computedStyles = getComputedStyle(element);
            // add padding
            widthOffset += getNumberOfCss(computedStyles.paddingLeft) + getNumberOfCss(computedStyles.paddingRight);
            heightOffset += getNumberOfCss(computedStyles.paddingTop) + getNumberOfCss(computedStyles.paddingBottom);
            // add margins
            widthOffset += getNumberOfCss(computedStyles.marginLeft) + getNumberOfCss(computedStyles.marginRight);
            heightOffset += getNumberOfCss(computedStyles.marginTop) + getNumberOfCss(computedStyles.marginBottom);
        }
        var width = clone.scrollWidth + widthOffset;
        var height = clone.scrollHeight + heightOffset;
        // remove clone from the DOM
        clone.parentElement.removeChild(clone); // .remove() is not working in IE
        // set 'real' width / height
        // domElement.css({
        //   'width': width + 'px',
        //   'height': height + 'px',
        // });
    };
    /**
     * Hack for IE + Firefox
     * when the settings panel fades out while an item of a select box is still hovered, the select box will not fade out
     * while the settings panel does. This would leave a floating select box, which is just weird
     */
    SettingsPanel.prototype.hideHoveredSelectBoxes = function () {
        this.getComputedItems().forEach(function (item) {
            if (item.isActive() && item.setting instanceof selectbox_1.SelectBox) {
                var selectBox_1 = item.setting;
                var oldDisplay_1 = selectBox_1.getDomElement().css('display');
                // updating the display to none marks the select-box as inactive, so it will be hidden with the rest
                // we just have to make sure to reset this as soon as possible
                selectBox_1.getDomElement().css('display', 'none');
                if (window.requestAnimationFrame) {
                    requestAnimationFrame(function () { selectBox_1.getDomElement().css('display', oldDisplay_1); });
                }
                else {
                    // IE9 has no requestAnimationFrame, set the value directly. It has no optimization about ignoring DOM-changes
                    // between animationFrames
                    selectBox_1.getDomElement().css('display', oldDisplay_1);
                }
            }
        });
    };
    SettingsPanel.prototype.release = function () {
        _super.prototype.release.call(this);
        if (this.hideTimeout) {
            this.hideTimeout.clear();
        }
    };
    /**
     * Checks if there are active settings within the root page of the settings panel.
     * An active setting is a setting that is visible and enabled, which the user can interact with.
     * @returns {boolean} true if there are active settings, false if the panel is functionally empty to a user
     */
    SettingsPanel.prototype.rootPageHasActiveSettings = function () {
        return this.getRootPage().hasActiveSettings();
    };
    SettingsPanel.prototype.getPages = function () {
        return this.config.components.filter(function (component) { return component instanceof settingspanelpage_1.SettingsPanelPage; });
    };
    // collect all items from all pages (see hideHoveredSelectBoxes)
    SettingsPanel.prototype.getComputedItems = function () {
        var allItems = [];
        for (var _i = 0, _a = this.getPages(); _i < _a.length; _i++) {
            var page = _a[_i];
            allItems.push.apply(allItems, page.getItems());
        }
        return allItems;
    };
    SettingsPanel.prototype.getRootPage = function () {
        return this.getPages()[0];
    };
    SettingsPanel.prototype.onSettingsStateChangedEvent = function () {
        this.settingsPanelEvents.onSettingsStateChanged.dispatch(this);
    };
    Object.defineProperty(SettingsPanel.prototype, "onSettingsStateChanged", {
        get: function () {
            return this.settingsPanelEvents.onSettingsStateChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    SettingsPanel.CLASS_ACTIVE_PAGE = 'active';
    return SettingsPanel;
}(container_1.Container));
exports.SettingsPanel = SettingsPanel;
},{"../eventdispatcher":77,"../timeout":85,"./container":19,"./selectbox":38,"./settingspanelpage":41}],40:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var component_1 = require("./component");
var eventdispatcher_1 = require("../eventdispatcher");
var label_1 = require("./label");
var selectbox_1 = require("./selectbox");
var listbox_1 = require("./listbox");
var videoqualityselectbox_1 = require("./videoqualityselectbox");
var audioqualityselectbox_1 = require("./audioqualityselectbox");
var playbackspeedselectbox_1 = require("./playbackspeedselectbox");
/**
 * An item for a {@link SettingsPanelPage},
 * Containing an optional {@link Label} and a component that configures a setting.
 * If the components is a {@link SelectBox} it will handle the logic of displaying it or not
 */
var SettingsPanelItem = /** @class */ (function (_super) {
    __extends(SettingsPanelItem, _super);
    function SettingsPanelItem(label, setting, config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.settingsPanelItemEvents = {
            onActiveChanged: new eventdispatcher_1.EventDispatcher(),
        };
        _this.setting = setting;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settings-panel-item',
        }, _this.config);
        if (label !== null) {
            if (label instanceof component_1.Component) {
                _this.label = label;
            }
            else {
                _this.label = new label_1.Label({ text: label });
            }
            _this.addComponent(_this.label);
        }
        _this.addComponent(_this.setting);
        return _this;
    }
    SettingsPanelItem.prototype.configure = function (player, uimanager) {
        var _this = this;
        if (this.setting instanceof selectbox_1.SelectBox || this.setting instanceof listbox_1.ListBox) {
            var handleConfigItemChanged = function () {
                if (!(_this.setting instanceof selectbox_1.SelectBox) && !(_this.setting instanceof listbox_1.ListBox)) {
                    return;
                }
                // The minimum number of items that must be available for the setting to be displayed
                // By default, at least two items must be available, else a selection is not possible
                var minItemsToDisplay = 2;
                // Audio/video quality select boxes contain an additional 'auto' mode, which in combination with a single
                // available quality also does not make sense
                if ((_this.setting instanceof videoqualityselectbox_1.VideoQualitySelectBox && _this.setting.hasAutoItem())
                    || _this.setting instanceof audioqualityselectbox_1.AudioQualitySelectBox) {
                    minItemsToDisplay = 3;
                }
                if (_this.setting.itemCount() < minItemsToDisplay) {
                    // Hide the setting if no meaningful choice is available
                    _this.hide();
                }
                else if (_this.setting instanceof playbackspeedselectbox_1.PlaybackSpeedSelectBox
                    && !uimanager.getConfig().playbackSpeedSelectionEnabled) {
                    // Hide the PlaybackSpeedSelectBox if disabled in config
                    _this.hide();
                }
                else {
                    _this.show();
                }
                // Visibility might have changed and therefore the active state might have changed so we fire the event
                // TODO fire only when state has really changed (e.g. check if visibility has really changed)
                _this.onActiveChangedEvent();
            };
            this.setting.onItemAdded.subscribe(handleConfigItemChanged);
            this.setting.onItemRemoved.subscribe(handleConfigItemChanged);
            // Initialize hidden state
            handleConfigItemChanged();
        }
    };
    /**
     * Checks if this settings panel item is active, i.e. visible and enabled and a user can interact with it.
     * @returns {boolean} true if the panel is active, else false
     */
    SettingsPanelItem.prototype.isActive = function () {
        return this.isShown();
    };
    SettingsPanelItem.prototype.onActiveChangedEvent = function () {
        this.settingsPanelItemEvents.onActiveChanged.dispatch(this);
    };
    Object.defineProperty(SettingsPanelItem.prototype, "onActiveChanged", {
        /**
         * Gets the event that is fired when the 'active' state of this item changes.
         * @see #isActive
         * @returns {Event<SettingsPanelItem, NoArgs>}
         */
        get: function () {
            return this.settingsPanelItemEvents.onActiveChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return SettingsPanelItem;
}(container_1.Container));
exports.SettingsPanelItem = SettingsPanelItem;
},{"../eventdispatcher":77,"./audioqualityselectbox":8,"./component":18,"./container":19,"./label":26,"./listbox":27,"./playbackspeedselectbox":31,"./selectbox":38,"./videoqualityselectbox":68}],41:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var settingspanelitem_1 = require("./settingspanelitem");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A panel containing a list of {@link SettingsPanelItem items} that represent labelled settings.
 */
var SettingsPanelPage = /** @class */ (function (_super) {
    __extends(SettingsPanelPage, _super);
    function SettingsPanelPage(config) {
        var _this = _super.call(this, config) || this;
        _this.settingsPanelPageEvents = {
            onSettingsStateChanged: new eventdispatcher_1.EventDispatcher(),
            onActive: new eventdispatcher_1.EventDispatcher(),
            onInactive: new eventdispatcher_1.EventDispatcher(),
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settings-panel-page',
        }, _this.config);
        return _this;
    }
    SettingsPanelPage.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        // Fire event when the state of a settings-item has changed
        var settingsStateChangedHandler = function () {
            _this.onSettingsStateChangedEvent();
            // Attach marker class to last visible item
            var lastShownItem = null;
            for (var _i = 0, _a = _this.getItems(); _i < _a.length; _i++) {
                var component = _a[_i];
                component.getDomElement().removeClass(_this.prefixCss(SettingsPanelPage.CLASS_LAST));
                if (component.isShown()) {
                    lastShownItem = component;
                }
            }
            if (lastShownItem) {
                lastShownItem.getDomElement().addClass(_this.prefixCss(SettingsPanelPage.CLASS_LAST));
            }
        };
        for (var _i = 0, _a = this.getItems(); _i < _a.length; _i++) {
            var component = _a[_i];
            component.onActiveChanged.subscribe(settingsStateChangedHandler);
        }
    };
    SettingsPanelPage.prototype.hasActiveSettings = function () {
        for (var _i = 0, _a = this.getItems(); _i < _a.length; _i++) {
            var component = _a[_i];
            if (component.isActive()) {
                return true;
            }
        }
        return false;
    };
    SettingsPanelPage.prototype.getItems = function () {
        return this.config.components.filter(function (component) { return component instanceof settingspanelitem_1.SettingsPanelItem; });
    };
    SettingsPanelPage.prototype.onSettingsStateChangedEvent = function () {
        this.settingsPanelPageEvents.onSettingsStateChanged.dispatch(this);
    };
    Object.defineProperty(SettingsPanelPage.prototype, "onSettingsStateChanged", {
        get: function () {
            return this.settingsPanelPageEvents.onSettingsStateChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    SettingsPanelPage.prototype.onActiveEvent = function () {
        this.settingsPanelPageEvents.onActive.dispatch(this);
    };
    Object.defineProperty(SettingsPanelPage.prototype, "onActive", {
        get: function () {
            return this.settingsPanelPageEvents.onActive.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    SettingsPanelPage.prototype.onInactiveEvent = function () {
        this.settingsPanelPageEvents.onInactive.dispatch(this);
    };
    Object.defineProperty(SettingsPanelPage.prototype, "onInactive", {
        get: function () {
            return this.settingsPanelPageEvents.onInactive.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    SettingsPanelPage.CLASS_LAST = 'last';
    return SettingsPanelPage;
}(container_1.Container));
exports.SettingsPanelPage = SettingsPanelPage;
},{"../eventdispatcher":77,"./container":19,"./settingspanelitem":40}],42:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var settingspanelpagenavigatorbutton_1 = require("./settingspanelpagenavigatorbutton");
var SettingsPanelPageBackButton = /** @class */ (function (_super) {
    __extends(SettingsPanelPageBackButton, _super);
    function SettingsPanelPageBackButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settingspanelpagebackbutton',
            text: 'back',
        }, _this.config);
        return _this;
    }
    SettingsPanelPageBackButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            _this.popPage();
        });
    };
    return SettingsPanelPageBackButton;
}(settingspanelpagenavigatorbutton_1.SettingsPanelPageNavigatorButton));
exports.SettingsPanelPageBackButton = SettingsPanelPageBackButton;
},{"./settingspanelpagenavigatorbutton":43}],43:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("./button");
var SettingsPanelPageNavigatorButton = /** @class */ (function (_super) {
    __extends(SettingsPanelPageNavigatorButton, _super);
    function SettingsPanelPageNavigatorButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {}, _this.config);
        _this.container = _this.config.container;
        _this.targetPage = _this.config.targetPage;
        return _this;
    }
    /**
     * navigate one level back
     */
    SettingsPanelPageNavigatorButton.prototype.popPage = function () {
        this.container.popSettingsPanelPage();
    };
    /**
     * navigate to the target page
     */
    SettingsPanelPageNavigatorButton.prototype.pushTargetPage = function () {
        this.container.setActivePage(this.targetPage);
    };
    return SettingsPanelPageNavigatorButton;
}(button_1.Button));
exports.SettingsPanelPageNavigatorButton = SettingsPanelPageNavigatorButton;
},{"./button":12}],44:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var settingspanelpagenavigatorbutton_1 = require("./settingspanelpagenavigatorbutton");
var SettingsPanelPageOpenButton = /** @class */ (function (_super) {
    __extends(SettingsPanelPageOpenButton, _super);
    function SettingsPanelPageOpenButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settingspanelpageopenbutton',
            text: 'open',
        }, _this.config);
        return _this;
    }
    SettingsPanelPageOpenButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            _this.pushTargetPage();
        });
    };
    return SettingsPanelPageOpenButton;
}(settingspanelpagenavigatorbutton_1.SettingsPanelPageNavigatorButton));
exports.SettingsPanelPageOpenButton = SettingsPanelPageOpenButton;
},{"./settingspanelpagenavigatorbutton":43}],45:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
var settingspanel_1 = require("./settingspanel");
var arrayutils_1 = require("../arrayutils");
/**
 * A button that toggles visibility of a settings panel.
 */
var SettingsToggleButton = /** @class */ (function (_super) {
    __extends(SettingsToggleButton, _super);
    function SettingsToggleButton(config) {
        var _this = _super.call(this, config) || this;
        _this.visibleSettingsPanels = [];
        if (!config.settingsPanel) {
            throw new Error('Required SettingsPanel is missing');
        }
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settingstogglebutton',
            text: 'Settings',
            settingsPanel: null,
            autoHideWhenNoActiveSettings: true,
        }, _this.config);
        return _this;
    }
    SettingsToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig(); // TODO fix generics type inference
        var settingsPanel = config.settingsPanel;
        this.onClick.subscribe(function () {
            // only hide other `SettingsPanel`s if a new one will be opened
            if (!settingsPanel.isShown()) {
                // Hide all open SettingsPanels before opening this button's panel
                // (We need to iterate a copy because hiding them will automatically remove themselves from the array
                // due to the subscribeOnce above)
                _this.visibleSettingsPanels.slice().forEach(function (settingsPanel) { return settingsPanel.hide(); });
            }
            settingsPanel.toggleHidden();
        });
        settingsPanel.onShow.subscribe(function () {
            // Set toggle status to on when the settings panel shows
            _this.on();
        });
        settingsPanel.onHide.subscribe(function () {
            // Set toggle status to off when the settings panel hides
            _this.off();
        });
        // Ensure that only one `SettingPanel` is visible at once
        // Keep track of shown SettingsPanels
        uimanager.onComponentShow.subscribe(function (sender) {
            if (sender instanceof settingspanel_1.SettingsPanel) {
                _this.visibleSettingsPanels.push(sender);
                sender.onHide.subscribeOnce(function () { return arrayutils_1.ArrayUtils.remove(_this.visibleSettingsPanels, sender); });
            }
        });
        // Handle automatic hiding of the button if there are no settings for the user to interact with
        if (config.autoHideWhenNoActiveSettings) {
            // Setup handler to show/hide button when the settings change
            var settingsPanelItemsChangedHandler = function () {
                if (settingsPanel.rootPageHasActiveSettings()) {
                    if (_this.isHidden()) {
                        _this.show();
                    }
                }
                else {
                    if (_this.isShown()) {
                        _this.hide();
                    }
                }
            };
            // Wire the handler to the event
            settingsPanel.onSettingsStateChanged.subscribe(settingsPanelItemsChangedHandler);
            // Call handler for first init at startup
            settingsPanelItemsChangedHandler();
        }
    };
    return SettingsToggleButton;
}(togglebutton_1.ToggleButton));
exports.SettingsToggleButton = SettingsToggleButton;
},{"../arrayutils":1,"./settingspanel":39,"./togglebutton":65}],46:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
/**
 * A dummy component that just reserves some space and does nothing else.
 */
var Spacer = /** @class */ (function (_super) {
    __extends(Spacer, _super);
    function Spacer(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-spacer',
        }, _this.config);
        return _this;
    }
    Spacer.prototype.onShowEvent = function () {
        // disable event firing by overwriting and not calling super
    };
    Spacer.prototype.onHideEvent = function () {
        // disable event firing by overwriting and not calling super
    };
    Spacer.prototype.onHoverChangedEvent = function (hovered) {
        // disable event firing by overwriting and not calling super
    };
    return Spacer;
}(component_1.Component));
exports.Spacer = Spacer;
},{"./component":18}],47:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var listbox_1 = require("./listbox");
var subtitleutils_1 = require("../subtitleutils");
/**
 * A element that is similar to a select box where the user can select a subtitle
 */
var SubtitleListBox = /** @class */ (function (_super) {
    __extends(SubtitleListBox, _super);
    function SubtitleListBox() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SubtitleListBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        new subtitleutils_1.SubtitleSwitchHandler(player, this, uimanager);
    };
    return SubtitleListBox;
}(listbox_1.ListBox));
exports.SubtitleListBox = SubtitleListBox;
},{"../subtitleutils":84,"./listbox":27}],48:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var label_1 = require("./label");
var controlbar_1 = require("./controlbar");
var eventdispatcher_1 = require("../eventdispatcher");
var dom_1 = require("../dom");
/**
 * Overlays the player to display subtitles.
 */
var SubtitleOverlay = /** @class */ (function (_super) {
    __extends(SubtitleOverlay, _super);
    function SubtitleOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.preprocessLabelEventCallback = new eventdispatcher_1.EventDispatcher();
        _this.previewSubtitleActive = false;
        _this.previewSubtitle = new SubtitleLabel({ text: 'example subtitle' });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-subtitle-overlay',
        }, _this.config);
        return _this;
    }
    SubtitleOverlay.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var subtitleManager = new ActiveSubtitleManager();
        this.subtitleManager = subtitleManager;
        player.on(player.exports.PlayerEvent.CueEnter, function (event) {
            // Sanitize cue data (must be done before the cue ID is generated in subtitleManager.cueEnter)
            if (event.position) {
                // Sometimes the positions are undefined, we assume them to be zero
                event.position.row = event.position.row || 0;
                event.position.column = event.position.column || 0;
            }
            var labelToAdd = subtitleManager.cueEnter(event);
            _this.preprocessLabelEventCallback.dispatch(event, labelToAdd);
            if (_this.previewSubtitleActive) {
                _this.removeComponent(_this.previewSubtitle);
            }
            _this.addComponent(labelToAdd);
            _this.updateComponents();
            _this.show();
        });
        player.on(player.exports.PlayerEvent.CueExit, function (event) {
            var labelToRemove = subtitleManager.cueExit(event);
            if (labelToRemove) {
                _this.removeComponent(labelToRemove);
                _this.updateComponents();
            }
            if (!subtitleManager.hasCues) {
                if (!_this.previewSubtitleActive) {
                    _this.hide();
                }
                else {
                    _this.addComponent(_this.previewSubtitle);
                    _this.updateComponents();
                }
            }
        });
        var subtitleClearHandler = function () {
            _this.hide();
            subtitleManager.clear();
            _this.removeComponents();
            _this.updateComponents();
        };
        player.on(player.exports.PlayerEvent.AudioChanged, subtitleClearHandler);
        player.on(player.exports.PlayerEvent.SubtitleEnabled, subtitleClearHandler);
        player.on(player.exports.PlayerEvent.SubtitleDisabled, subtitleClearHandler);
        player.on(player.exports.PlayerEvent.Seek, subtitleClearHandler);
        player.on(player.exports.PlayerEvent.TimeShift, subtitleClearHandler);
        player.on(player.exports.PlayerEvent.PlaybackFinished, subtitleClearHandler);
        player.on(player.exports.PlayerEvent.SourceUnloaded, subtitleClearHandler);
        uimanager.onComponentShow.subscribe(function (component) {
            if (component instanceof controlbar_1.ControlBar) {
                _this.getDomElement().addClass(_this.prefixCss(SubtitleOverlay.CLASS_CONTROLBAR_VISIBLE));
            }
        });
        uimanager.onComponentHide.subscribe(function (component) {
            if (component instanceof controlbar_1.ControlBar) {
                _this.getDomElement().removeClass(_this.prefixCss(SubtitleOverlay.CLASS_CONTROLBAR_VISIBLE));
            }
        });
        this.configureCea608Captions(player, uimanager);
        // Init
        subtitleClearHandler();
    };
    SubtitleOverlay.prototype.configureCea608Captions = function (player, uimanager) {
        var _this = this;
        // The calculated font size
        var fontSize = 0;
        // The required letter spacing spread the text characters evenly across the grid
        var fontLetterSpacing = 0;
        // Flag telling if a font size calculation is required of if the current values are valid
        var fontSizeCalculationRequired = true;
        // Flag telling if the CEA-608 mode is enabled
        var enabled = false;
        var updateCEA608FontSize = function () {
            var dummyLabel = new SubtitleLabel({ text: 'X' });
            dummyLabel.getDomElement().css({
                // By using a large font size we do not need to use multiple letters and can get still an
                // accurate measurement even though the returned size is an integer value
                'font-size': '200px',
                'line-height': '200px',
                'visibility': 'hidden',
            });
            _this.addComponent(dummyLabel);
            _this.updateComponents();
            _this.show();
            var dummyLabelCharWidth = dummyLabel.getDomElement().width();
            var dummyLabelCharHeight = dummyLabel.getDomElement().height();
            var fontSizeRatio = dummyLabelCharWidth / dummyLabelCharHeight;
            _this.removeComponent(dummyLabel);
            _this.updateComponents();
            if (!_this.subtitleManager.hasCues) {
                _this.hide();
            }
            // We subtract 1px here to avoid line breaks at the right border of the subtitle overlay that can happen
            // when texts contain whitespaces. It's probably some kind of pixel rounding issue in the browser's
            // layouting, but the actual reason could not be determined. Aiming for a target width - 1px would work in
            // most browsers, but Safari has a "quantized" font size rendering with huge steps in between so we need
            // to subtract some more pixels to avoid line breaks there as well.
            var subtitleOverlayWidth = _this.getDomElement().width() - 10;
            var subtitleOverlayHeight = _this.getDomElement().height();
            // The size ratio of the letter grid
            var fontGridSizeRatio = (dummyLabelCharWidth * SubtitleOverlay.CEA608_NUM_COLUMNS) /
                (dummyLabelCharHeight * SubtitleOverlay.CEA608_NUM_ROWS);
            // The size ratio of the available space for the grid
            var subtitleOverlaySizeRatio = subtitleOverlayWidth / subtitleOverlayHeight;
            if (subtitleOverlaySizeRatio > fontGridSizeRatio) {
                // When the available space is wider than the text grid, the font size is simply
                // determined by the height of the available space.
                fontSize = subtitleOverlayHeight / SubtitleOverlay.CEA608_NUM_ROWS;
                // Calculate the additional letter spacing required to evenly spread the text across the grid's width
                var gridSlotWidth = subtitleOverlayWidth / SubtitleOverlay.CEA608_NUM_COLUMNS;
                var fontCharWidth = fontSize * fontSizeRatio;
                fontLetterSpacing = gridSlotWidth - fontCharWidth;
            }
            else {
                // When the available space is not wide enough, texts would vertically overlap if we take
                // the height as a base for the font size, so we need to limit the height. We do that
                // by determining the font size by the width of the available space.
                fontSize = subtitleOverlayWidth / SubtitleOverlay.CEA608_NUM_COLUMNS / fontSizeRatio;
                fontLetterSpacing = 0;
            }
            // Update font-size of all active subtitle labels
            for (var _i = 0, _a = _this.getComponents(); _i < _a.length; _i++) {
                var label = _a[_i];
                if (label instanceof SubtitleLabel) {
                    label.getDomElement().css({
                        'font-size': fontSize + "px",
                        'letter-spacing': fontLetterSpacing + "px",
                    });
                }
            }
        };
        player.on(player.exports.PlayerEvent.PlayerResized, function () {
            if (enabled) {
                updateCEA608FontSize();
            }
            else {
                fontSizeCalculationRequired = true;
            }
        });
        this.preprocessLabelEventCallback.subscribe(function (event, label) {
            var isCEA608 = event.position != null;
            if (!isCEA608) {
                // Skip all non-CEA608 cues
                return;
            }
            if (!enabled) {
                enabled = true;
                _this.getDomElement().addClass(_this.prefixCss(SubtitleOverlay.CLASS_CEA_608));
                // We conditionally update the font size by this flag here to avoid updating every time a subtitle
                // is added into an empty overlay. Because we reset the overlay when all subtitles are gone, this
                // would trigger an unnecessary update every time, but it's only required under certain conditions,
                // e.g. after the player size has changed.
                if (fontSizeCalculationRequired) {
                    updateCEA608FontSize();
                    fontSizeCalculationRequired = false;
                }
            }
            label.getDomElement().css({
                'left': event.position.column * SubtitleOverlay.CEA608_COLUMN_OFFSET + "%",
                'top': event.position.row * SubtitleOverlay.CEA608_ROW_OFFSET + "%",
                'font-size': fontSize + "px",
                'letter-spacing': fontLetterSpacing + "px",
            });
        });
        var reset = function () {
            _this.getDomElement().removeClass(_this.prefixCss(SubtitleOverlay.CLASS_CEA_608));
            enabled = false;
        };
        player.on(player.exports.PlayerEvent.CueExit, function () {
            if (!_this.subtitleManager.hasCues) {
                // Disable CEA-608 mode when all subtitles are gone (to allow correct formatting and
                // display of other types of subtitles, e.g. the formatting preview subtitle)
                reset();
            }
        });
        player.on(player.exports.PlayerEvent.SourceUnloaded, reset);
        player.on(player.exports.PlayerEvent.SubtitleEnabled, reset);
        player.on(player.exports.PlayerEvent.SubtitleDisabled, reset);
    };
    SubtitleOverlay.prototype.enablePreviewSubtitleLabel = function () {
        this.previewSubtitleActive = true;
        if (!this.subtitleManager.hasCues) {
            this.addComponent(this.previewSubtitle);
            this.updateComponents();
            this.show();
        }
    };
    SubtitleOverlay.prototype.removePreviewSubtitleLabel = function () {
        this.previewSubtitleActive = false;
        this.removeComponent(this.previewSubtitle);
        this.updateComponents();
    };
    SubtitleOverlay.CLASS_CONTROLBAR_VISIBLE = 'controlbar-visible';
    SubtitleOverlay.CLASS_CEA_608 = 'cea608';
    // The number of rows in a cea608 grid
    SubtitleOverlay.CEA608_NUM_ROWS = 15;
    // The number of columns in a cea608 grid
    SubtitleOverlay.CEA608_NUM_COLUMNS = 32;
    // The offset in percent for one row (which is also the height of a row)
    SubtitleOverlay.CEA608_ROW_OFFSET = 100 / SubtitleOverlay.CEA608_NUM_ROWS;
    // The offset in percent for one column (which is also the width of a column)
    SubtitleOverlay.CEA608_COLUMN_OFFSET = 100 / SubtitleOverlay.CEA608_NUM_COLUMNS;
    return SubtitleOverlay;
}(container_1.Container));
exports.SubtitleOverlay = SubtitleOverlay;
var SubtitleLabel = /** @class */ (function (_super) {
    __extends(SubtitleLabel, _super);
    function SubtitleLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-subtitle-label',
        }, _this.config);
        return _this;
    }
    return SubtitleLabel;
}(label_1.Label));
var ActiveSubtitleManager = /** @class */ (function () {
    function ActiveSubtitleManager() {
        this.activeSubtitleCueMap = {};
        this.activeSubtitleCueCount = 0;
    }
    /**
     * Calculates a unique ID for a subtitle cue, which is needed to associate an CueEnter with its CueExit
     * event so we can remove the correct subtitle in CueExit when multiple subtitles are active at the same time.
     * The start time plus the text should make a unique identifier, and in the only case where a collision
     * can happen, two similar texts will be displayed at a similar time and a similar position (or without position).
     * The start time should always be known, because it is required to schedule the CueEnter event. The end time
     * must not necessarily be known and therefore cannot be used for the ID.
     * @param event
     * @return {string}
     */
    ActiveSubtitleManager.calculateId = function (event) {
        var id = event.start + '-' + event.text;
        if (event.position) {
            id += '-' + event.position.row + '-' + event.position.column;
        }
        return id;
    };
    /**
     * Adds a subtitle cue to the manager and returns the label that should be added to the subtitle overlay.
     * @param event
     * @return {SubtitleLabel}
     */
    ActiveSubtitleManager.prototype.cueEnter = function (event) {
        var id = ActiveSubtitleManager.calculateId(event);
        var label = new SubtitleLabel({
            // Prefer the HTML subtitle text if set, else try generating a image tag as string from the image attribute,
            // else use the plain text
            text: event.html || ActiveSubtitleManager.generateImageTagText(event.image) || event.text,
        });
        // Create array for id if it does not exist
        this.activeSubtitleCueMap[id] = this.activeSubtitleCueMap[id] || [];
        // Add cue
        this.activeSubtitleCueMap[id].push({ event: event, label: label });
        this.activeSubtitleCueCount++;
        return label;
    };
    ActiveSubtitleManager.generateImageTagText = function (imageData) {
        if (!imageData) {
            return;
        }
        var imgTag = new dom_1.DOM('img', {
            src: imageData,
        });
        imgTag.css('width', '100%');
        return imgTag.get(0).outerHTML; // return the html as string
    };
    /**
     * Returns the label associated with an already added cue.
     * @param event
     * @return {SubtitleLabel}
     */
    ActiveSubtitleManager.prototype.getCues = function (event) {
        var id = ActiveSubtitleManager.calculateId(event);
        var activeSubtitleCues = this.activeSubtitleCueMap[id];
        if (activeSubtitleCues && activeSubtitleCues.length > 0) {
            return activeSubtitleCues.map(function (cue) { return cue.label; });
        }
        else {
            return null;
        }
    };
    /**
     * Removes the subtitle cue from the manager and returns the label that should be removed from the subtitle overlay,
     * or null if there is no associated label existing (e.g. because all labels have been {@link #clear cleared}.
     * @param event
     * @return {SubtitleLabel|null}
     */
    ActiveSubtitleManager.prototype.cueExit = function (event) {
        var id = ActiveSubtitleManager.calculateId(event);
        var activeSubtitleCues = this.activeSubtitleCueMap[id];
        if (activeSubtitleCues && activeSubtitleCues.length > 0) {
            // Remove cue
            /* We apply the FIFO approach here and remove the oldest cue from the associated id. When there are multiple cues
             * with the same id, there is no way to know which one of the cues is to be deleted, so we just hope that FIFO
             * works fine. Theoretically it can happen that two cues with colliding ids are removed at different times, in
             * the wrong order. This rare case has yet to be observed. If it ever gets an issue, we can take the unstable
             * cue end time (which can change between CueEnter and CueExit IN CueUpdate) and use it as an
             * additional hint to try and remove the correct one of the colliding cues.
             */
            var activeSubtitleCue = activeSubtitleCues.shift();
            this.activeSubtitleCueCount--;
            return activeSubtitleCue.label;
        }
        else {
            return null;
        }
    };
    Object.defineProperty(ActiveSubtitleManager.prototype, "cueCount", {
        /**
         * Returns the number of active subtitle cues.
         * @return {number}
         */
        get: function () {
            // We explicitly count the cues to save an Array.reduce on every cueCount call (which can happen frequently)
            return this.activeSubtitleCueCount;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActiveSubtitleManager.prototype, "hasCues", {
        /**
         * Returns true if there are active subtitle cues, else false.
         * @return {boolean}
         */
        get: function () {
            return this.cueCount > 0;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Removes all subtitle cues from the manager.
     */
    ActiveSubtitleManager.prototype.clear = function () {
        this.activeSubtitleCueMap = {};
        this.activeSubtitleCueCount = 0;
    };
    return ActiveSubtitleManager;
}());
},{"../dom":75,"../eventdispatcher":77,"./container":19,"./controlbar":20,"./label":26}],49:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var selectbox_1 = require("./selectbox");
var subtitleutils_1 = require("../subtitleutils");
/**
 * A select box providing a selection between available subtitle and caption tracks.
 */
var SubtitleSelectBox = /** @class */ (function (_super) {
    __extends(SubtitleSelectBox, _super);
    function SubtitleSelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitleselectbox'],
        }, _this.config);
        return _this;
    }
    SubtitleSelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        new subtitleutils_1.SubtitleSwitchHandler(player, this, uimanager);
    };
    return SubtitleSelectBox;
}(selectbox_1.SelectBox));
exports.SubtitleSelectBox = SubtitleSelectBox;
},{"../subtitleutils":84,"./selectbox":38}],50:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different background colors.
 */
var BackgroundColorSelectBox = /** @class */ (function (_super) {
    __extends(BackgroundColorSelectBox, _super);
    function BackgroundColorSelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingsbackgroundcolorselectbox'],
        }, _this.config);
        return _this;
    }
    BackgroundColorSelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('white', 'white');
        this.addItem('black', 'black');
        this.addItem('red', 'red');
        this.addItem('green', 'green');
        this.addItem('blue', 'blue');
        this.addItem('cyan', 'cyan');
        this.addItem('yellow', 'yellow');
        this.addItem('magenta', 'magenta');
        var setColorAndOpacity = function () {
            if (_this.settingsManager.backgroundColor.isSet() && _this.settingsManager.backgroundOpacity.isSet()) {
                _this.toggleOverlayClass('bgcolor-' + _this.settingsManager.backgroundColor.value + _this.settingsManager.backgroundOpacity.value);
            }
            else {
                _this.toggleOverlayClass(null);
            }
        };
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.backgroundColor.value = key;
        });
        this.settingsManager.backgroundColor.onChanged.subscribe(function (sender, property) {
            // Color and opacity go together, so we need to...
            if (!_this.settingsManager.backgroundColor.isSet()) {
                // ... clear the opacity when the color is not set
                _this.settingsManager.backgroundOpacity.clear();
            }
            else if (!_this.settingsManager.backgroundOpacity.isSet()) {
                // ... set an opacity when the color is set
                _this.settingsManager.backgroundOpacity.value = '100';
            }
            _this.selectItem(property.value);
            setColorAndOpacity();
        });
        this.settingsManager.backgroundOpacity.onChanged.subscribe(function () {
            setColorAndOpacity();
        });
        // Load initial value
        if (this.settingsManager.backgroundColor.isSet()) {
            this.selectItem(this.settingsManager.backgroundColor.value);
        }
    };
    return BackgroundColorSelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.BackgroundColorSelectBox = BackgroundColorSelectBox;
},{"./subtitlesettingselectbox":57}],51:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different background opacity.
 */
var BackgroundOpacitySelectBox = /** @class */ (function (_super) {
    __extends(BackgroundOpacitySelectBox, _super);
    function BackgroundOpacitySelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingsbackgroundopacityselectbox'],
        }, _this.config);
        return _this;
    }
    BackgroundOpacitySelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('100', '100%');
        this.addItem('75', '75%');
        this.addItem('50', '50%');
        this.addItem('25', '25%');
        this.addItem('0', '0%');
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.backgroundOpacity.value = key;
            // Color and opacity go together, so we need to...
            if (!_this.settingsManager.backgroundOpacity.isSet()) {
                // ... clear the color when the opacity is not set
                _this.settingsManager.backgroundColor.clear();
            }
            else if (!_this.settingsManager.backgroundColor.isSet()) {
                // ... set a color when the opacity is set
                _this.settingsManager.backgroundColor.value = 'black';
            }
        });
        // Update selected item when value is set from somewhere else
        this.settingsManager.backgroundOpacity.onChanged.subscribe(function (sender, property) {
            _this.selectItem(property.value);
        });
        // Load initial value
        if (this.settingsManager.backgroundOpacity.isSet()) {
            this.selectItem(this.settingsManager.backgroundOpacity.value);
        }
    };
    return BackgroundOpacitySelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.BackgroundOpacitySelectBox = BackgroundOpacitySelectBox;
},{"./subtitlesettingselectbox":57}],52:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different character edge.
 */
var CharacterEdgeSelectBox = /** @class */ (function (_super) {
    __extends(CharacterEdgeSelectBox, _super);
    function CharacterEdgeSelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingscharacteredgeselectbox'],
        }, _this.config);
        return _this;
    }
    CharacterEdgeSelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('raised', 'raised');
        this.addItem('depressed', 'depressed');
        this.addItem('uniform', 'uniform');
        this.addItem('dropshadowed', 'drop shadowed');
        this.settingsManager.characterEdge.onChanged.subscribe(function (sender, property) {
            if (property.isSet()) {
                _this.toggleOverlayClass('characteredge-' + property.value);
            }
            else {
                _this.toggleOverlayClass(null);
            }
            // Select the item in case the property was set from outside
            _this.selectItem(property.value);
        });
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.characterEdge.value = key;
        });
        // Load initial value
        if (this.settingsManager.characterEdge.isSet()) {
            this.selectItem(this.settingsManager.characterEdge.value);
        }
    };
    return CharacterEdgeSelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.CharacterEdgeSelectBox = CharacterEdgeSelectBox;
},{"./subtitlesettingselectbox":57}],53:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different font colors.
 */
var FontColorSelectBox = /** @class */ (function (_super) {
    __extends(FontColorSelectBox, _super);
    function FontColorSelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingsfontcolorselectbox'],
        }, _this.config);
        return _this;
    }
    FontColorSelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('white', 'white');
        this.addItem('black', 'black');
        this.addItem('red', 'red');
        this.addItem('green', 'green');
        this.addItem('blue', 'blue');
        this.addItem('cyan', 'cyan');
        this.addItem('yellow', 'yellow');
        this.addItem('magenta', 'magenta');
        var setColorAndOpacity = function () {
            if (_this.settingsManager.fontColor.isSet() && _this.settingsManager.fontOpacity.isSet()) {
                _this.toggleOverlayClass('fontcolor-' + _this.settingsManager.fontColor.value + _this.settingsManager.fontOpacity.value);
            }
            else {
                _this.toggleOverlayClass(null);
            }
        };
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.fontColor.value = key;
        });
        this.settingsManager.fontColor.onChanged.subscribe(function (sender, property) {
            // Color and opacity go together, so we need to...
            if (!_this.settingsManager.fontColor.isSet()) {
                // ... clear the opacity when the color is not set
                _this.settingsManager.fontOpacity.clear();
            }
            else if (!_this.settingsManager.fontOpacity.isSet()) {
                // ... set an opacity when the color is set
                _this.settingsManager.fontOpacity.value = '100';
            }
            _this.selectItem(property.value);
            setColorAndOpacity();
        });
        this.settingsManager.fontOpacity.onChanged.subscribe(function () {
            setColorAndOpacity();
        });
        // Load initial value
        if (this.settingsManager.fontColor.isSet()) {
            this.selectItem(this.settingsManager.fontColor.value);
        }
    };
    return FontColorSelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.FontColorSelectBox = FontColorSelectBox;
},{"./subtitlesettingselectbox":57}],54:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different font family.
 */
var FontFamilySelectBox = /** @class */ (function (_super) {
    __extends(FontFamilySelectBox, _super);
    function FontFamilySelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingsfontfamilyselectbox'],
        }, _this.config);
        return _this;
    }
    FontFamilySelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('monospacedserif', 'monospaced serif');
        this.addItem('proportionalserif', 'proportional serif');
        this.addItem('monospacedsansserif', 'monospaced sans serif');
        this.addItem('proportionalsansserif', 'proportional sans serif');
        this.addItem('casual', 'casual');
        this.addItem('cursive', 'cursive');
        this.addItem('smallcapital', 'small capital');
        this.settingsManager.fontFamily.onChanged.subscribe(function (sender, property) {
            if (property.isSet()) {
                _this.toggleOverlayClass('fontfamily-' + property.value);
            }
            else {
                _this.toggleOverlayClass(null);
            }
            // Select the item in case the property was set from outside
            _this.selectItem(property.value);
        });
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.fontFamily.value = key;
        });
        // Load initial value
        if (this.settingsManager.fontFamily.isSet()) {
            this.selectItem(this.settingsManager.fontFamily.value);
        }
    };
    return FontFamilySelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.FontFamilySelectBox = FontFamilySelectBox;
},{"./subtitlesettingselectbox":57}],55:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different font colors.
 */
var FontOpacitySelectBox = /** @class */ (function (_super) {
    __extends(FontOpacitySelectBox, _super);
    function FontOpacitySelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingsfontopacityselectbox'],
        }, _this.config);
        return _this;
    }
    FontOpacitySelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('100', '100%');
        this.addItem('75', '75%');
        this.addItem('50', '50%');
        this.addItem('25', '25%');
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.fontOpacity.value = key;
            // Color and opacity go together, so we need to...
            if (!_this.settingsManager.fontOpacity.isSet()) {
                // ... clear the color when the opacity is not set
                _this.settingsManager.fontColor.clear();
            }
            else if (!_this.settingsManager.fontColor.isSet()) {
                // ... set a color when the opacity is set
                _this.settingsManager.fontColor.value = 'white';
            }
        });
        // Update selected item when value is set from somewhere else
        this.settingsManager.fontOpacity.onChanged.subscribe(function (sender, property) {
            _this.selectItem(property.value);
        });
        // Load initial value
        if (this.settingsManager.fontOpacity.isSet()) {
            this.selectItem(this.settingsManager.fontOpacity.value);
        }
    };
    return FontOpacitySelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.FontOpacitySelectBox = FontOpacitySelectBox;
},{"./subtitlesettingselectbox":57}],56:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different font colors.
 */
var FontSizeSelectBox = /** @class */ (function (_super) {
    __extends(FontSizeSelectBox, _super);
    function FontSizeSelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingsfontsizeselectbox'],
        }, _this.config);
        return _this;
    }
    FontSizeSelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('50', '50%');
        this.addItem('75', '75%');
        this.addItem('100', '100%');
        this.addItem('150', '150%');
        this.addItem('200', '200%');
        this.addItem('300', '300%');
        this.addItem('400', '400%');
        this.settingsManager.fontSize.onChanged.subscribe(function (sender, property) {
            if (property.isSet()) {
                _this.toggleOverlayClass('fontsize-' + property.value);
            }
            else {
                _this.toggleOverlayClass(null);
            }
            // Select the item in case the property was set from outside
            _this.selectItem(property.value);
        });
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.fontSize.value = key;
        });
        // Load initial value
        if (this.settingsManager.fontSize.isSet()) {
            this.selectItem(this.settingsManager.fontSize.value);
        }
    };
    return FontSizeSelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.FontSizeSelectBox = FontSizeSelectBox;
},{"./subtitlesettingselectbox":57}],57:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var selectbox_1 = require("../selectbox");
/**
 * Base class for all subtitles settings select box
 **/
var SubtitleSettingSelectBox = /** @class */ (function (_super) {
    __extends(SubtitleSettingSelectBox, _super);
    function SubtitleSettingSelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.settingsManager = config.settingsManager;
        _this.overlay = config.overlay;
        return _this;
    }
    /**
     * Removes a previously set class and adds the passed in class.
     * @param cssClass The new class to replace the previous class with or null to just remove the previous class
     */
    SubtitleSettingSelectBox.prototype.toggleOverlayClass = function (cssClass) {
        // Remove previous class if existing
        if (this.currentCssClass) {
            this.overlay.getDomElement().removeClass(this.currentCssClass);
            this.currentCssClass = null;
        }
        // Add new class if specified. If the new class is null, we don't add anything.
        if (cssClass) {
            this.currentCssClass = this.prefixCss(cssClass);
            this.overlay.getDomElement().addClass(this.currentCssClass);
        }
    };
    return SubtitleSettingSelectBox;
}(selectbox_1.SelectBox));
exports.SubtitleSettingSelectBox = SubtitleSettingSelectBox;
},{"../selectbox":38}],58:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("../container");
var dom_1 = require("../../dom");
var SubtitleSettingsLabel = /** @class */ (function (_super) {
    __extends(SubtitleSettingsLabel, _super);
    function SubtitleSettingsLabel(config) {
        var _this = _super.call(this, config) || this;
        _this.opener = config.opener;
        _this.text = config.text;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-label',
            components: [
                _this.opener,
            ],
        }, _this.config);
        return _this;
    }
    SubtitleSettingsLabel.prototype.toDomElement = function () {
        var labelElement = new dom_1.DOM('span', {
            'id': this.config.id,
            'class': this.getCssClasses(),
        }).append(new dom_1.DOM('span', {}).html(this.text), this.opener.getDomElement());
        return labelElement;
    };
    return SubtitleSettingsLabel;
}(container_1.Container));
exports.SubtitleSettingsLabel = SubtitleSettingsLabel;
},{"../../dom":75,"../container":19}],59:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var storageutils_1 = require("../../storageutils");
var component_1 = require("../component");
var eventdispatcher_1 = require("../../eventdispatcher");
var SubtitleSettingsManager = /** @class */ (function () {
    function SubtitleSettingsManager() {
        var _this = this;
        this._properties = {
            fontColor: new SubtitleSettingsProperty(this),
            fontOpacity: new SubtitleSettingsProperty(this),
            fontFamily: new SubtitleSettingsProperty(this),
            fontSize: new SubtitleSettingsProperty(this),
            characterEdge: new SubtitleSettingsProperty(this),
            backgroundColor: new SubtitleSettingsProperty(this),
            backgroundOpacity: new SubtitleSettingsProperty(this),
            windowColor: new SubtitleSettingsProperty(this),
            windowOpacity: new SubtitleSettingsProperty(this),
        };
        this.userSettings = {};
        this.localStorageKey = DummyComponent.instance().prefixCss('subtitlesettings');
        var _loop_1 = function (propertyName) {
            this_1._properties[propertyName].onChanged.subscribe(function (sender, property) {
                if (property.isSet()) {
                    _this.userSettings[propertyName] = property.value;
                }
                else {
                    // Delete the property from the settings object if unset to avoid serialization of null values
                    delete _this.userSettings[propertyName];
                }
                // Save the settings object when a property has changed
                _this.save();
            });
        };
        var this_1 = this;
        for (var propertyName in this._properties) {
            _loop_1(propertyName);
        }
        this.load();
    }
    SubtitleSettingsManager.prototype.reset = function () {
        for (var propertyName in this._properties) {
            this._properties[propertyName].clear();
        }
    };
    Object.defineProperty(SubtitleSettingsManager.prototype, "fontColor", {
        get: function () {
            return this._properties.fontColor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "fontOpacity", {
        get: function () {
            return this._properties.fontOpacity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "fontFamily", {
        get: function () {
            return this._properties.fontFamily;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "fontSize", {
        get: function () {
            return this._properties.fontSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "characterEdge", {
        get: function () {
            return this._properties.characterEdge;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "backgroundColor", {
        get: function () {
            return this._properties.backgroundColor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "backgroundOpacity", {
        get: function () {
            return this._properties.backgroundOpacity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "windowColor", {
        get: function () {
            return this._properties.windowColor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubtitleSettingsManager.prototype, "windowOpacity", {
        get: function () {
            return this._properties.windowOpacity;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Saves the settings to local storage.
     */
    SubtitleSettingsManager.prototype.save = function () {
        storageutils_1.StorageUtils.setObject(this.localStorageKey, this.userSettings);
    };
    /**
     * Loads the settings from local storage
     */
    SubtitleSettingsManager.prototype.load = function () {
        this.userSettings = storageutils_1.StorageUtils.getObject(this.localStorageKey) || {};
        // Apply the loaded settings
        for (var property in this.userSettings) {
            this._properties[property].value = this.userSettings[property];
        }
    };
    return SubtitleSettingsManager;
}());
exports.SubtitleSettingsManager = SubtitleSettingsManager;
/**
 * A dummy component whose sole purpose is to expose the {@link #prefixCss} method to the
 * {@link SubtitleSettingsManager}.
 */
var DummyComponent = /** @class */ (function (_super) {
    __extends(DummyComponent, _super);
    function DummyComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DummyComponent.instance = function () {
        if (!DummyComponent._instance) {
            DummyComponent._instance = new DummyComponent();
        }
        return DummyComponent._instance;
    };
    DummyComponent.prototype.prefixCss = function (cssClassOrId) {
        return _super.prototype.prefixCss.call(this, cssClassOrId);
    };
    return DummyComponent;
}(component_1.Component));
var SubtitleSettingsProperty = /** @class */ (function () {
    function SubtitleSettingsProperty(manager) {
        this._manager = manager;
        this._onChanged = new eventdispatcher_1.EventDispatcher();
    }
    SubtitleSettingsProperty.prototype.isSet = function () {
        return this._value != null;
    };
    SubtitleSettingsProperty.prototype.clear = function () {
        this._value = null;
        this.onChangedEvent(null);
    };
    Object.defineProperty(SubtitleSettingsProperty.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (typeof value === 'string' && value === 'null') {
                value = null;
            }
            this._value = value;
            this.onChangedEvent(value);
        },
        enumerable: true,
        configurable: true
    });
    SubtitleSettingsProperty.prototype.onChangedEvent = function (value) {
        this._onChanged.dispatch(this._manager, this);
    };
    Object.defineProperty(SubtitleSettingsProperty.prototype, "onChanged", {
        get: function () {
            return this._onChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return SubtitleSettingsProperty;
}());
exports.SubtitleSettingsProperty = SubtitleSettingsProperty;
},{"../../eventdispatcher":77,"../../storageutils":82,"../component":18}],60:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var settingspanelpage_1 = require("../settingspanelpage");
var subtitlesettingsmanager_1 = require("./subtitlesettingsmanager");
var fontsizeselectbox_1 = require("./fontsizeselectbox");
var fontfamilyselectbox_1 = require("./fontfamilyselectbox");
var fontcolorselectbox_1 = require("./fontcolorselectbox");
var fontopacityselectbox_1 = require("./fontopacityselectbox");
var characteredgeselectbox_1 = require("./characteredgeselectbox");
var backgroundcolorselectbox_1 = require("./backgroundcolorselectbox");
var backgroundopacityselectbox_1 = require("./backgroundopacityselectbox");
var windowcolorselectbox_1 = require("./windowcolorselectbox");
var windowopacityselectbox_1 = require("./windowopacityselectbox");
var subtitlesettingsresetbutton_1 = require("./subtitlesettingsresetbutton");
var settingspanelpagebackbutton_1 = require("../settingspanelpagebackbutton");
var settingspanelitem_1 = require("../settingspanelitem");
var SubtitleSettingsPanelPage = /** @class */ (function (_super) {
    __extends(SubtitleSettingsPanelPage, _super);
    function SubtitleSettingsPanelPage(config) {
        var _this = _super.call(this, config) || this;
        _this.overlay = config.overlay;
        _this.settingsPanel = config.settingsPanel;
        var manager = new subtitlesettingsmanager_1.SubtitleSettingsManager();
        _this.config = _this.mergeConfig(config, {
            components: [
                new settingspanelitem_1.SettingsPanelItem('Font size', new fontsizeselectbox_1.FontSizeSelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Font family', new fontfamilyselectbox_1.FontFamilySelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Font color', new fontcolorselectbox_1.FontColorSelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Font opacity', new fontopacityselectbox_1.FontOpacitySelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Character edge', new characteredgeselectbox_1.CharacterEdgeSelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Background color', new backgroundcolorselectbox_1.BackgroundColorSelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Background opacity', new backgroundopacityselectbox_1.BackgroundOpacitySelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Window color', new windowcolorselectbox_1.WindowColorSelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem('Window opacity', new windowopacityselectbox_1.WindowOpacitySelectBox({
                    overlay: _this.overlay, settingsManager: manager,
                })),
                new settingspanelitem_1.SettingsPanelItem(new settingspanelpagebackbutton_1.SettingsPanelPageBackButton({
                    container: _this.settingsPanel,
                    text: 'Back',
                }), new subtitlesettingsresetbutton_1.SubtitleSettingsResetButton({
                    settingsManager: manager,
                })),
            ],
        }, _this.config);
        return _this;
    }
    SubtitleSettingsPanelPage.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.onActive.subscribe(function () {
            _this.overlay.enablePreviewSubtitleLabel();
        });
        this.onInactive.subscribe(function () {
            _this.overlay.removePreviewSubtitleLabel();
        });
    };
    return SubtitleSettingsPanelPage;
}(settingspanelpage_1.SettingsPanelPage));
exports.SubtitleSettingsPanelPage = SubtitleSettingsPanelPage;
},{"../settingspanelitem":40,"../settingspanelpage":41,"../settingspanelpagebackbutton":42,"./backgroundcolorselectbox":50,"./backgroundopacityselectbox":51,"./characteredgeselectbox":52,"./fontcolorselectbox":53,"./fontfamilyselectbox":54,"./fontopacityselectbox":55,"./fontsizeselectbox":56,"./subtitlesettingsmanager":59,"./subtitlesettingsresetbutton":61,"./windowcolorselectbox":62,"./windowopacityselectbox":63}],61:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("../button");
/**
 * A button that resets all subtitle settings to their defaults.
 */
var SubtitleSettingsResetButton = /** @class */ (function (_super) {
    __extends(SubtitleSettingsResetButton, _super);
    function SubtitleSettingsResetButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-subtitlesettingsresetbutton',
            text: 'Reset',
        }, _this.config);
        return _this;
    }
    SubtitleSettingsResetButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            _this.config.settingsManager.reset();
        });
    };
    return SubtitleSettingsResetButton;
}(button_1.Button));
exports.SubtitleSettingsResetButton = SubtitleSettingsResetButton;
},{"../button":12}],62:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different background colors.
 */
var WindowColorSelectBox = /** @class */ (function (_super) {
    __extends(WindowColorSelectBox, _super);
    function WindowColorSelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingswindowcolorselectbox'],
        }, _this.config);
        return _this;
    }
    WindowColorSelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('white', 'white');
        this.addItem('black', 'black');
        this.addItem('red', 'red');
        this.addItem('green', 'green');
        this.addItem('blue', 'blue');
        this.addItem('cyan', 'cyan');
        this.addItem('yellow', 'yellow');
        this.addItem('magenta', 'magenta');
        var setColorAndOpacity = function () {
            if (_this.settingsManager.windowColor.isSet() && _this.settingsManager.windowOpacity.isSet()) {
                _this.toggleOverlayClass('windowcolor-' + _this.settingsManager.windowColor.value + _this.settingsManager.windowOpacity.value);
            }
            else {
                _this.toggleOverlayClass(null);
            }
        };
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.windowColor.value = key;
        });
        this.settingsManager.windowColor.onChanged.subscribe(function (sender, property) {
            // Color and opacity go together, so we need to...
            if (!_this.settingsManager.windowColor.isSet()) {
                // ... clear the opacity when the color is not set
                _this.settingsManager.windowOpacity.clear();
            }
            else if (!_this.settingsManager.windowOpacity.isSet()) {
                // ... set an opacity when the color is set
                _this.settingsManager.windowOpacity.value = '100';
            }
            _this.selectItem(property.value);
            setColorAndOpacity();
        });
        this.settingsManager.windowOpacity.onChanged.subscribe(function () {
            setColorAndOpacity();
        });
        // Load initial value
        if (this.settingsManager.windowColor.isSet()) {
            this.selectItem(this.settingsManager.windowColor.value);
        }
    };
    return WindowColorSelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.WindowColorSelectBox = WindowColorSelectBox;
},{"./subtitlesettingselectbox":57}],63:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var subtitlesettingselectbox_1 = require("./subtitlesettingselectbox");
/**
 * A select box providing a selection of different background opacity.
 */
var WindowOpacitySelectBox = /** @class */ (function (_super) {
    __extends(WindowOpacitySelectBox, _super);
    function WindowOpacitySelectBox(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-subtitlesettingswindowopacityselectbox'],
        }, _this.config);
        return _this;
    }
    WindowOpacitySelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        this.addItem(null, 'default');
        this.addItem('100', '100%');
        this.addItem('75', '75%');
        this.addItem('50', '50%');
        this.addItem('25', '25%');
        this.addItem('0', '0%');
        this.onItemSelected.subscribe(function (sender, key) {
            _this.settingsManager.windowOpacity.value = key;
            // Color and opacity go together, so we need to...
            if (!_this.settingsManager.windowOpacity.isSet()) {
                // ... clear the color when the opacity is not set
                _this.settingsManager.windowColor.clear();
            }
            else if (!_this.settingsManager.windowColor.isSet()) {
                // ... set a color when the opacity is set
                _this.settingsManager.windowColor.value = 'black';
            }
        });
        // Update selected item when value is set from somewhere else
        this.settingsManager.windowOpacity.onChanged.subscribe(function (sender, property) {
            _this.selectItem(property.value);
        });
        // Load initial value
        if (this.settingsManager.windowOpacity.isSet()) {
            this.selectItem(this.settingsManager.windowOpacity.value);
        }
    };
    return WindowOpacitySelectBox;
}(subtitlesettingselectbox_1.SubtitleSettingSelectBox));
exports.WindowOpacitySelectBox = WindowOpacitySelectBox;
},{"./subtitlesettingselectbox":57}],64:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var metadatalabel_1 = require("./metadatalabel");
/**
 * Displays a title bar containing a label with the title of the video.
 */
var TitleBar = /** @class */ (function (_super) {
    __extends(TitleBar, _super);
    function TitleBar(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-titlebar',
            hidden: true,
            components: [
                new metadatalabel_1.MetadataLabel({ content: metadatalabel_1.MetadataLabelContent.Title }),
                new metadatalabel_1.MetadataLabel({ content: metadatalabel_1.MetadataLabelContent.Description }),
            ],
            keepHiddenWithoutMetadata: false,
        }, _this.config);
        return _this;
    }
    TitleBar.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        var shouldBeShown = !this.isHidden();
        var hasMetadataText = true; // Flag to track if any metadata label contains text
        var checkMetadataTextAndUpdateVisibility = function () {
            hasMetadataText = false;
            // Iterate through metadata labels and check if at least one of them contains text
            for (var _i = 0, _a = _this.getComponents(); _i < _a.length; _i++) {
                var component = _a[_i];
                if (component instanceof metadatalabel_1.MetadataLabel) {
                    if (!component.isEmpty()) {
                        hasMetadataText = true;
                        break;
                    }
                }
            }
            if (_this.isShown()) {
                // Hide a visible titlebar if it does not contain any text and the hidden flag is set
                if (config.keepHiddenWithoutMetadata && !hasMetadataText) {
                    _this.hide();
                }
            }
            else if (shouldBeShown) {
                // Show a hidden titlebar if it should actually be shown
                _this.show();
            }
        };
        // Listen to text change events to update the hasMetadataText flag when the metadata dynamically changes
        for (var _i = 0, _a = this.getComponents(); _i < _a.length; _i++) {
            var component = _a[_i];
            if (component instanceof metadatalabel_1.MetadataLabel) {
                component.onTextChanged.subscribe(checkMetadataTextAndUpdateVisibility);
            }
        }
        uimanager.onControlsShow.subscribe(function () {
            shouldBeShown = true;
            if (!(config.keepHiddenWithoutMetadata && !hasMetadataText)) {
                _this.show();
            }
        });
        uimanager.onControlsHide.subscribe(function () {
            shouldBeShown = false;
            _this.hide();
        });
        // init
        checkMetadataTextAndUpdateVisibility();
    };
    return TitleBar;
}(container_1.Container));
exports.TitleBar = TitleBar;
},{"./container":19,"./metadatalabel":29}],65:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var button_1 = require("./button");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A button that can be toggled between 'on' and 'off' states.
 */
var ToggleButton = /** @class */ (function (_super) {
    __extends(ToggleButton, _super);
    function ToggleButton(config) {
        var _this = _super.call(this, config) || this;
        _this.toggleButtonEvents = {
            onToggle: new eventdispatcher_1.EventDispatcher(),
            onToggleOn: new eventdispatcher_1.EventDispatcher(),
            onToggleOff: new eventdispatcher_1.EventDispatcher(),
        };
        var defaultConfig = {
            cssClass: 'ui-togglebutton',
            onClass: 'on',
            offClass: 'off',
        };
        _this.config = _this.mergeConfig(config, defaultConfig, _this.config);
        return _this;
    }
    ToggleButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        this.getDomElement().addClass(this.prefixCss(config.offClass));
    };
    /**
     * Toggles the button to the 'on' state.
     */
    ToggleButton.prototype.on = function () {
        if (this.isOff()) {
            var config = this.getConfig();
            this.onState = true;
            this.getDomElement().removeClass(this.prefixCss(config.offClass));
            this.getDomElement().addClass(this.prefixCss(config.onClass));
            this.onToggleEvent();
            this.onToggleOnEvent();
        }
    };
    /**
     * Toggles the button to the 'off' state.
     */
    ToggleButton.prototype.off = function () {
        if (this.isOn()) {
            var config = this.getConfig();
            this.onState = false;
            this.getDomElement().removeClass(this.prefixCss(config.onClass));
            this.getDomElement().addClass(this.prefixCss(config.offClass));
            this.onToggleEvent();
            this.onToggleOffEvent();
        }
    };
    /**
     * Toggle the button 'on' if it is 'off', or 'off' if it is 'on'.
     */
    ToggleButton.prototype.toggle = function () {
        if (this.isOn()) {
            this.off();
        }
        else {
            this.on();
        }
    };
    /**
     * Checks if the toggle button is in the 'on' state.
     * @returns {boolean} true if button is 'on', false if 'off'
     */
    ToggleButton.prototype.isOn = function () {
        return this.onState;
    };
    /**
     * Checks if the toggle button is in the 'off' state.
     * @returns {boolean} true if button is 'off', false if 'on'
     */
    ToggleButton.prototype.isOff = function () {
        return !this.isOn();
    };
    ToggleButton.prototype.onClickEvent = function () {
        _super.prototype.onClickEvent.call(this);
        // Fire the toggle event together with the click event
        // (they are technically the same, only the semantics are different)
        this.onToggleEvent();
    };
    ToggleButton.prototype.onToggleEvent = function () {
        this.toggleButtonEvents.onToggle.dispatch(this);
    };
    ToggleButton.prototype.onToggleOnEvent = function () {
        this.toggleButtonEvents.onToggleOn.dispatch(this);
    };
    ToggleButton.prototype.onToggleOffEvent = function () {
        this.toggleButtonEvents.onToggleOff.dispatch(this);
    };
    Object.defineProperty(ToggleButton.prototype, "onToggle", {
        /**
         * Gets the event that is fired when the button is toggled.
         * @returns {Event<ToggleButton<Config>, NoArgs>}
         */
        get: function () {
            return this.toggleButtonEvents.onToggle.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ToggleButton.prototype, "onToggleOn", {
        /**
         * Gets the event that is fired when the button is toggled 'on'.
         * @returns {Event<ToggleButton<Config>, NoArgs>}
         */
        get: function () {
            return this.toggleButtonEvents.onToggleOn.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ToggleButton.prototype, "onToggleOff", {
        /**
         * Gets the event that is fired when the button is toggled 'off'.
         * @returns {Event<ToggleButton<Config>, NoArgs>}
         */
        get: function () {
            return this.toggleButtonEvents.onToggleOff.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return ToggleButton;
}(button_1.Button));
exports.ToggleButton = ToggleButton;
},{"../eventdispatcher":77,"./button":12}],66:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("./component");
var dom_1 = require("../dom");
/**
 * Animated analog TV static noise.
 */
var TvNoiseCanvas = /** @class */ (function (_super) {
    __extends(TvNoiseCanvas, _super);
    function TvNoiseCanvas(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.canvasWidth = 160;
        _this.canvasHeight = 90;
        _this.interferenceHeight = 50;
        _this.lastFrameUpdate = 0;
        _this.frameInterval = 60;
        _this.useAnimationFrame = !!window.requestAnimationFrame;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-tvnoisecanvas',
        }, _this.config);
        return _this;
    }
    TvNoiseCanvas.prototype.toDomElement = function () {
        return this.canvas = new dom_1.DOM('canvas', { 'class': this.getCssClasses() });
    };
    TvNoiseCanvas.prototype.start = function () {
        this.canvasElement = this.canvas.get(0);
        this.canvasContext = this.canvasElement.getContext('2d');
        this.noiseAnimationWindowPos = -this.canvasHeight;
        this.lastFrameUpdate = 0;
        this.canvasElement.width = this.canvasWidth;
        this.canvasElement.height = this.canvasHeight;
        this.renderFrame();
    };
    TvNoiseCanvas.prototype.stop = function () {
        if (this.useAnimationFrame) {
            cancelAnimationFrame(this.frameUpdateHandlerId);
        }
        else {
            clearTimeout(this.frameUpdateHandlerId);
        }
    };
    TvNoiseCanvas.prototype.renderFrame = function () {
        // This code has been copied from the player controls.js and simplified
        if (this.lastFrameUpdate + this.frameInterval > new Date().getTime()) {
            // It's too early to render the next frame
            this.scheduleNextRender();
            return;
        }
        var currentPixelOffset;
        var canvasWidth = this.canvasWidth;
        var canvasHeight = this.canvasHeight;
        // Create texture
        var noiseImage = this.canvasContext.createImageData(canvasWidth, canvasHeight);
        // Fill texture with noise
        for (var y = 0; y < canvasHeight; y++) {
            for (var x = 0; x < canvasWidth; x++) {
                currentPixelOffset = (canvasWidth * y * 4) + x * 4;
                noiseImage.data[currentPixelOffset] = Math.random() * 255;
                if (y < this.noiseAnimationWindowPos || y > this.noiseAnimationWindowPos + this.interferenceHeight) {
                    noiseImage.data[currentPixelOffset] *= 0.85;
                }
                noiseImage.data[currentPixelOffset + 1] = noiseImage.data[currentPixelOffset];
                noiseImage.data[currentPixelOffset + 2] = noiseImage.data[currentPixelOffset];
                noiseImage.data[currentPixelOffset + 3] = 50;
            }
        }
        // Put texture onto canvas
        this.canvasContext.putImageData(noiseImage, 0, 0);
        this.lastFrameUpdate = new Date().getTime();
        this.noiseAnimationWindowPos += 7;
        if (this.noiseAnimationWindowPos > canvasHeight) {
            this.noiseAnimationWindowPos = -canvasHeight;
        }
        this.scheduleNextRender();
    };
    TvNoiseCanvas.prototype.scheduleNextRender = function () {
        if (this.useAnimationFrame) {
            this.frameUpdateHandlerId = window.requestAnimationFrame(this.renderFrame.bind(this));
        }
        else {
            this.frameUpdateHandlerId = setTimeout(this.renderFrame.bind(this), this.frameInterval);
        }
    };
    return TvNoiseCanvas;
}(component_1.Component));
exports.TvNoiseCanvas = TvNoiseCanvas;
},{"../dom":75,"./component":18}],67:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var dom_1 = require("../dom");
var timeout_1 = require("../timeout");
var playerutils_1 = require("../playerutils");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * The base container that contains all of the UI. The UIContainer is passed to the {@link UIManager} to build and
 * setup the UI.
 */
var UIContainer = /** @class */ (function (_super) {
    __extends(UIContainer, _super);
    function UIContainer(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-uicontainer',
            hideDelay: 5000,
        }, _this.config);
        _this.playerStateChange = new eventdispatcher_1.EventDispatcher();
        return _this;
    }
    UIContainer.prototype.configure = function (player, uimanager) {
        var config = this.getConfig();
        if (config.userInteractionEventSource) {
            this.userInteractionEventSource = new dom_1.DOM(config.userInteractionEventSource);
        }
        else {
            this.userInteractionEventSource = this.getDomElement();
        }
        _super.prototype.configure.call(this, player, uimanager);
        this.configureUIShowHide(player, uimanager);
        this.configurePlayerStates(player, uimanager);
    };
    UIContainer.prototype.configureUIShowHide = function (player, uimanager) {
        var _this = this;
        var config = this.getConfig();
        if (config.hideDelay === -1) {
            uimanager.onConfigured.subscribe(function () { return uimanager.onControlsShow.dispatch(_this); });
            return;
        }
        var isUiShown = false;
        var isSeeking = false;
        var isFirstTouch = true;
        var playerState;
        var hidingPrevented = function () {
            return config.hidePlayerStateExceptions && config.hidePlayerStateExceptions.indexOf(playerState) > -1;
        };
        var showUi = function () {
            if (!isUiShown) {
                // Let subscribers know that they should reveal themselves
                uimanager.onControlsShow.dispatch(_this);
                isUiShown = true;
            }
            // Don't trigger timeout while seeking (it will be triggered once the seek is finished) or casting
            if (!isSeeking && !player.isCasting() && !hidingPrevented()) {
                _this.uiHideTimeout.start();
            }
        };
        var hideUi = function () {
            // Hide the UI only if it is shown, and if not casting
            if (isUiShown && !player.isCasting()) {
                // Issue a preview event to check if we are good to hide the controls
                var previewHideEventArgs = {};
                uimanager.onPreviewControlsHide.dispatch(_this, previewHideEventArgs);
                if (!previewHideEventArgs.cancel) {
                    // If the preview wasn't canceled, let subscribers know that they should now hide themselves
                    uimanager.onControlsHide.dispatch(_this);
                    isUiShown = false;
                }
                else {
                    // If the hide preview was canceled, continue to show UI
                    showUi();
                }
            }
        };
        // Timeout to defer UI hiding by the configured delay time
        this.uiHideTimeout = new timeout_1.Timeout(config.hideDelay, hideUi);
        this.userInteractionEvents = [{
                // On touch displays, the first touch reveals the UI
                name: 'touchend',
                handler: function (e) {
                    if (!isUiShown) {
                        // Only if the UI is hidden, we prevent other actions (except for the first touch) and reveal the UI
                        // instead. The first touch is not prevented to let other listeners receive the event and trigger an
                        // initial action, e.g. the huge playback button can directly start playback instead of requiring a double
                        // tap which 1. reveals the UI and 2. starts playback.
                        if (isFirstTouch) {
                            isFirstTouch = false;
                        }
                        else {
                            e.preventDefault();
                        }
                        showUi();
                    }
                },
            }, {
                // When the mouse enters, we show the UI
                name: 'mouseenter',
                handler: function () {
                    showUi();
                },
            }, {
                // When the mouse moves within, we show the UI
                name: 'mousemove',
                handler: function () {
                    showUi();
                },
            }, {
                // When the mouse leaves, we can prepare to hide the UI, except a seek is going on
                name: 'mouseleave',
                handler: function () {
                    // When a seek is going on, the seek scrub pointer may exit the UI area while still seeking, and we do not
                    // hide the UI in such cases
                    if (!isSeeking && !hidingPrevented()) {
                        _this.uiHideTimeout.start();
                    }
                },
            }];
        this.userInteractionEvents.forEach(function (event) { return _this.userInteractionEventSource.on(event.name, event.handler); });
        uimanager.onSeek.subscribe(function () {
            _this.uiHideTimeout.clear(); // Don't hide UI while a seek is in progress
            isSeeking = true;
        });
        uimanager.onSeeked.subscribe(function () {
            isSeeking = false;
            _this.uiHideTimeout.start(); // Re-enable UI hide timeout after a seek
        });
        player.on(player.exports.PlayerEvent.CastStarted, function () {
            showUi(); // Show UI when a Cast session has started (UI will then stay permanently on during the session)
        });
        this.playerStateChange.subscribe(function (_, state) {
            playerState = state;
            if (hidingPrevented()) {
                // Entering a player state that prevents hiding and forces the controls to be shown
                _this.uiHideTimeout.clear();
                showUi();
            }
            else {
                // Entering a player state that allows hiding
                _this.uiHideTimeout.start();
            }
        });
    };
    UIContainer.prototype.configurePlayerStates = function (player, uimanager) {
        var _this = this;
        var container = this.getDomElement();
        // Convert player states into CSS class names
        var stateClassNames = [];
        for (var state in playerutils_1.PlayerUtils.PlayerState) {
            if (isNaN(Number(state))) {
                var enumName = playerutils_1.PlayerUtils.PlayerState[playerutils_1.PlayerUtils.PlayerState[state]];
                stateClassNames[playerutils_1.PlayerUtils.PlayerState[state]] =
                    this.prefixCss(UIContainer.STATE_PREFIX + enumName.toLowerCase());
            }
        }
        var removeStates = function () {
            container.removeClass(stateClassNames[playerutils_1.PlayerUtils.PlayerState.Idle]);
            container.removeClass(stateClassNames[playerutils_1.PlayerUtils.PlayerState.Prepared]);
            container.removeClass(stateClassNames[playerutils_1.PlayerUtils.PlayerState.Playing]);
            container.removeClass(stateClassNames[playerutils_1.PlayerUtils.PlayerState.Paused]);
            container.removeClass(stateClassNames[playerutils_1.PlayerUtils.PlayerState.Finished]);
        };
        var updateState = function (state) {
            removeStates();
            container.addClass(stateClassNames[state]);
            _this.playerStateChange.dispatch(_this, state);
        };
        player.on(player.exports.PlayerEvent.SourceLoaded, function () {
            updateState(playerutils_1.PlayerUtils.PlayerState.Prepared);
        });
        player.on(player.exports.PlayerEvent.Play, function () {
            updateState(playerutils_1.PlayerUtils.PlayerState.Playing);
        });
        player.on(player.exports.PlayerEvent.Paused, function () {
            updateState(playerutils_1.PlayerUtils.PlayerState.Paused);
        });
        player.on(player.exports.PlayerEvent.PlaybackFinished, function () {
            updateState(playerutils_1.PlayerUtils.PlayerState.Finished);
        });
        player.on(player.exports.PlayerEvent.SourceUnloaded, function () {
            updateState(playerutils_1.PlayerUtils.PlayerState.Idle);
        });
        uimanager.getConfig().events.onUpdated.subscribe(function () {
            updateState(playerutils_1.PlayerUtils.getState(player));
        });
        // Init in current player state
        updateState(playerutils_1.PlayerUtils.getState(player));
        // Fullscreen marker class
        player.on(player.exports.PlayerEvent.ViewModeChanged, function () {
            if (player.getViewMode() === player.exports.ViewMode.Fullscreen) {
                container.addClass(_this.prefixCss(UIContainer.FULLSCREEN));
            }
            else {
                container.removeClass(_this.prefixCss(UIContainer.FULLSCREEN));
            }
        });
        // Init fullscreen state
        if (player.getViewMode() === player.exports.ViewMode.Fullscreen) {
            container.addClass(this.prefixCss(UIContainer.FULLSCREEN));
        }
        // Buffering marker class
        player.on(player.exports.PlayerEvent.StallStarted, function () {
            container.addClass(_this.prefixCss(UIContainer.BUFFERING));
        });
        player.on(player.exports.PlayerEvent.StallEnded, function () {
            container.removeClass(_this.prefixCss(UIContainer.BUFFERING));
        });
        // Init buffering state
        if (player.isStalled()) {
            container.addClass(this.prefixCss(UIContainer.BUFFERING));
        }
        // RemoteControl marker class
        player.on(player.exports.PlayerEvent.CastStarted, function () {
            container.addClass(_this.prefixCss(UIContainer.REMOTE_CONTROL));
        });
        player.on(player.exports.PlayerEvent.CastStopped, function () {
            container.removeClass(_this.prefixCss(UIContainer.REMOTE_CONTROL));
        });
        // Init RemoteControl state
        if (player.isCasting()) {
            container.addClass(this.prefixCss(UIContainer.REMOTE_CONTROL));
        }
        // Controls visibility marker class
        uimanager.onControlsShow.subscribe(function () {
            container.removeClass(_this.prefixCss(UIContainer.CONTROLS_HIDDEN));
            container.addClass(_this.prefixCss(UIContainer.CONTROLS_SHOWN));
        });
        uimanager.onControlsHide.subscribe(function () {
            container.removeClass(_this.prefixCss(UIContainer.CONTROLS_SHOWN));
            container.addClass(_this.prefixCss(UIContainer.CONTROLS_HIDDEN));
        });
        // Layout size classes
        var updateLayoutSizeClasses = function (width, height) {
            container.removeClass(_this.prefixCss('layout-max-width-400'));
            container.removeClass(_this.prefixCss('layout-max-width-600'));
            container.removeClass(_this.prefixCss('layout-max-width-800'));
            container.removeClass(_this.prefixCss('layout-max-width-1200'));
            if (width <= 400) {
                container.addClass(_this.prefixCss('layout-max-width-400'));
            }
            else if (width <= 600) {
                container.addClass(_this.prefixCss('layout-max-width-600'));
            }
            else if (width <= 800) {
                container.addClass(_this.prefixCss('layout-max-width-800'));
            }
            else if (width <= 1200) {
                container.addClass(_this.prefixCss('layout-max-width-1200'));
            }
        };
        player.on(player.exports.PlayerEvent.PlayerResized, function (e) {
            // Convert strings (with "px" suffix) to ints
            var width = Math.round(Number(e.width.substring(0, e.width.length - 2)));
            var height = Math.round(Number(e.height.substring(0, e.height.length - 2)));
            updateLayoutSizeClasses(width, height);
        });
        // Init layout state
        updateLayoutSizeClasses(new dom_1.DOM(player.getContainer()).width(), new dom_1.DOM(player.getContainer()).height());
    };
    UIContainer.prototype.release = function () {
        var _this = this;
        // Explicitly unsubscribe user interaction event handlers because they could be attached to an external element
        // that isn't owned by the UI and therefore not removed on release.
        this.userInteractionEvents.forEach(function (event) { return _this.userInteractionEventSource.off(event.name, event.handler); });
        _super.prototype.release.call(this);
        this.uiHideTimeout.clear();
    };
    UIContainer.prototype.toDomElement = function () {
        var container = _super.prototype.toDomElement.call(this);
        // Detect flexbox support (not supported in IE9)
        if (document && typeof document.createElement('p').style.flex !== 'undefined') {
            container.addClass(this.prefixCss('flexbox'));
        }
        else {
            container.addClass(this.prefixCss('no-flexbox'));
        }
        return container;
    };
    UIContainer.STATE_PREFIX = 'player-state-';
    UIContainer.FULLSCREEN = 'fullscreen';
    UIContainer.BUFFERING = 'buffering';
    UIContainer.REMOTE_CONTROL = 'remote-control';
    UIContainer.CONTROLS_SHOWN = 'controls-shown';
    UIContainer.CONTROLS_HIDDEN = 'controls-hidden';
    return UIContainer;
}(container_1.Container));
exports.UIContainer = UIContainer;
},{"../dom":75,"../eventdispatcher":77,"../playerutils":81,"../timeout":85,"./container":19}],68:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection between 'auto' and the available video qualities.
 */
var VideoQualitySelectBox = /** @class */ (function (_super) {
    __extends(VideoQualitySelectBox, _super);
    function VideoQualitySelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['ui-videoqualityselectbox'],
        }, _this.config);
        return _this;
    }
    VideoQualitySelectBox.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var selectCurrentVideoQuality = function () {
            _this.selectItem(player.getVideoQuality().id);
        };
        var updateVideoQualities = function () {
            var videoQualities = player.getAvailableVideoQualities();
            _this.clearItems();
            // Progressive streams do not support automatic quality selection
            _this.hasAuto = player.getStreamType() !== 'progressive';
            if (_this.hasAuto) {
                // Add entry for automatic quality switching (default setting)
                _this.addItem('auto', 'auto');
            }
            // Add video qualities
            for (var _i = 0, videoQualities_1 = videoQualities; _i < videoQualities_1.length; _i++) {
                var videoQuality = videoQualities_1[_i];
                _this.addItem(videoQuality.id, videoQuality.label);
            }
            // Select initial quality
            selectCurrentVideoQuality();
        };
        this.onItemSelected.subscribe(function (sender, value) {
            player.setVideoQuality(value);
        });
        // Update qualities when source goes away
        player.on(player.exports.PlayerEvent.SourceUnloaded, updateVideoQualities);
        // Update qualities when the period within a source changes
        player.on(player.exports.PlayerEvent.PeriodSwitched, updateVideoQualities);
        // Update quality selection when quality is changed (from outside)
        player.on(player.exports.PlayerEvent.VideoQualityChanged, selectCurrentVideoQuality);
        if (player.exports.PlayerEvent.VideoQualityAdded) {
            // Update qualities when their availability changed
            // TODO: remove any cast after next player release
            player.on(player.exports.PlayerEvent.VideoQualityAdded, updateVideoQualities);
            player.on(player.exports.PlayerEvent.VideoQualityRemoved, updateVideoQualities);
        }
        uimanager.getConfig().events.onUpdated.subscribe(updateVideoQualities);
    };
    /**
     * Returns true if the select box contains an 'auto' item for automatic quality selection mode.
     * @return {boolean}
     */
    VideoQualitySelectBox.prototype.hasAutoItem = function () {
        return this.hasAuto;
    };
    return VideoQualitySelectBox;
}(selectbox_1.SelectBox));
exports.VideoQualitySelectBox = VideoQualitySelectBox;
},{"./selectbox":38}],69:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./container");
var volumeslider_1 = require("./volumeslider");
var volumetogglebutton_1 = require("./volumetogglebutton");
var timeout_1 = require("../timeout");
/**
 * A composite volume control that consists of and internally manages a volume control button that can be used
 * for muting, and a (depending on the CSS style, e.g. slide-out) volume control bar.
 */
var VolumeControlButton = /** @class */ (function (_super) {
    __extends(VolumeControlButton, _super);
    function VolumeControlButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.volumeToggleButton = new volumetogglebutton_1.VolumeToggleButton();
        _this.volumeSlider = new volumeslider_1.VolumeSlider({
            vertical: config.vertical != null ? config.vertical : true,
            hidden: true,
        });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-volumecontrolbutton',
            components: [_this.volumeToggleButton, _this.volumeSlider],
            hideDelay: 500,
        }, _this.config);
        return _this;
    }
    VolumeControlButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var volumeToggleButton = this.getVolumeToggleButton();
        var volumeSlider = this.getVolumeSlider();
        this.volumeSliderHideTimeout = new timeout_1.Timeout(this.getConfig().hideDelay, function () {
            volumeSlider.hide();
        });
        /*
         * Volume Slider visibility handling
         *
         * The volume slider shall be visible while the user hovers the mute toggle button, while the user hovers the
         * volume slider, and while the user slides the volume slider. If none of these situations are true, the slider
         * shall disappear.
         */
        var volumeSliderHovered = false;
        volumeToggleButton.getDomElement().on('mouseenter', function () {
            // Show volume slider when mouse enters the button area
            if (volumeSlider.isHidden()) {
                volumeSlider.show();
            }
            // Avoid hiding of the slider when button is hovered
            _this.volumeSliderHideTimeout.clear();
        });
        volumeToggleButton.getDomElement().on('mouseleave', function () {
            // Hide slider delayed when button is left
            _this.volumeSliderHideTimeout.reset();
        });
        volumeSlider.getDomElement().on('mouseenter', function () {
            // When the slider is entered, cancel the hide timeout activated by leaving the button
            _this.volumeSliderHideTimeout.clear();
            volumeSliderHovered = true;
        });
        volumeSlider.getDomElement().on('mouseleave', function () {
            // When mouse leaves the slider, only hide it if there is no slide operation in progress
            if (volumeSlider.isSeeking()) {
                _this.volumeSliderHideTimeout.clear();
            }
            else {
                _this.volumeSliderHideTimeout.reset();
            }
            volumeSliderHovered = false;
        });
        volumeSlider.onSeeked.subscribe(function () {
            // When a slide operation is done and the slider not hovered (mouse outside slider), hide slider delayed
            if (!volumeSliderHovered) {
                _this.volumeSliderHideTimeout.reset();
            }
        });
    };
    VolumeControlButton.prototype.release = function () {
        _super.prototype.release.call(this);
        this.volumeSliderHideTimeout.clear();
    };
    /**
     * Provides access to the internally managed volume toggle button.
     * @returns {VolumeToggleButton}
     */
    VolumeControlButton.prototype.getVolumeToggleButton = function () {
        return this.volumeToggleButton;
    };
    /**
     * Provides access to the internally managed volume silder.
     * @returns {VolumeSlider}
     */
    VolumeControlButton.prototype.getVolumeSlider = function () {
        return this.volumeSlider;
    };
    return VolumeControlButton;
}(container_1.Container));
exports.VolumeControlButton = VolumeControlButton;
},{"../timeout":85,"./container":19,"./volumeslider":70,"./volumetogglebutton":71}],70:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var seekbar_1 = require("./seekbar");
/**
 * A simple volume slider component to adjust the player's volume setting.
 */
var VolumeSlider = /** @class */ (function (_super) {
    __extends(VolumeSlider, _super);
    function VolumeSlider(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.updateVolumeWhileScrubbing = function (sender, args) {
            if (args.scrubbing && _this.volumeTransition) {
                _this.volumeTransition.update(args.position);
            }
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-volumeslider',
            hideIfVolumeControlProhibited: true,
        }, _this.config);
        return _this;
    }
    VolumeSlider.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager, false);
        var config = this.getConfig();
        var volumeController = uimanager.getConfig().volumeController;
        if (config.hideIfVolumeControlProhibited && !this.detectVolumeControlAvailability()) {
            this.hide();
            // We can just return from here, because the user will never interact with the control and any configured
            // functionality would only eat resources for no reason.
            return;
        }
        volumeController.onChanged.subscribe(function (_, args) {
            if (args.muted) {
                _this.setPlaybackPosition(0);
            }
            else {
                _this.setPlaybackPosition(args.volume);
            }
        });
        this.onSeek.subscribe(function () {
            _this.volumeTransition = volumeController.startTransition();
        });
        this.onSeekPreview.subscribeRateLimited(this.updateVolumeWhileScrubbing, 50);
        this.onSeeked.subscribe(function (sender, percentage) {
            if (_this.volumeTransition) {
                _this.volumeTransition.finish(percentage);
            }
        });
        // Update the volume slider marker when the player resized, a source is loaded,
        // or the UI is configured. Check the seekbar for a detailed description.
        player.on(player.exports.PlayerEvent.PlayerResized, function () {
            _this.refreshPlaybackPosition();
        });
        uimanager.onConfigured.subscribe(function () {
            _this.refreshPlaybackPosition();
        });
        uimanager.getConfig().events.onUpdated.subscribe(function () {
            _this.refreshPlaybackPosition();
        });
        uimanager.onComponentShow.subscribe(function () {
            _this.refreshPlaybackPosition();
        });
        uimanager.onComponentHide.subscribe(function () {
            _this.refreshPlaybackPosition();
        });
        // Init volume bar
        volumeController.onChangedEvent();
    };
    VolumeSlider.prototype.detectVolumeControlAvailability = function () {
        /*
         * "On iOS devices, the audio level is always under the user’s physical control. The volume property is not
         * settable in JavaScript. Reading the volume property always returns 1."
         * https://developer.apple.com/library/content/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html
         */
        // as muted autoplay gets paused as soon as we unmute it, we may not touch the volume of the actual player so we
        // probe a dummy audio element
        var dummyVideoElement = document.createElement('video');
        // try setting the volume to 0.7 and if it's still 1 we are on a volume control restricted device
        dummyVideoElement.volume = 0.7;
        return dummyVideoElement.volume !== 1;
    };
    VolumeSlider.prototype.release = function () {
        _super.prototype.release.call(this);
        this.onSeekPreview.unsubscribe(this.updateVolumeWhileScrubbing);
    };
    VolumeSlider.issuerName = 'ui';
    return VolumeSlider;
}(seekbar_1.SeekBar));
exports.VolumeSlider = VolumeSlider;
},{"./seekbar":36}],71:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles audio muting.
 */
var VolumeToggleButton = /** @class */ (function (_super) {
    __extends(VolumeToggleButton, _super);
    function VolumeToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        var defaultConfig = {
            cssClass: 'ui-volumetogglebutton',
            text: 'Volume/Mute',
            onClass: 'muted',
            offClass: 'unmuted',
        };
        _this.config = _this.mergeConfig(config, defaultConfig, _this.config);
        return _this;
    }
    VolumeToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var volumeController = uimanager.getConfig().volumeController;
        volumeController.onChanged.subscribe(function (_, args) {
            if (args.muted) {
                _this.on();
            }
            else {
                _this.off();
            }
            var volumeLevelTens = Math.ceil(args.volume / 10);
            _this.getDomElement().data(_this.prefixCss('volume-level-tens'), String(volumeLevelTens));
        });
        // this.onClick.subscribe(() => {
        //   volumeController.toggleMuted();
        // });
        this.onClick.subscribe(function () {
            volumeController.toggleVolumeVisible();
        });
        // Startup init
        volumeController.onChangedEvent();
    };
    return VolumeToggleButton;
}(togglebutton_1.ToggleButton));
exports.VolumeToggleButton = VolumeToggleButton;
},{"./togglebutton":65}],72:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles the video view between normal/mono and VR/stereo.
 */
var VRToggleButton = /** @class */ (function (_super) {
    __extends(VRToggleButton, _super);
    function VRToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-vrtogglebutton',
            text: 'VR',
        }, _this.config);
        return _this;
    }
    VRToggleButton.prototype.configure = function (player, uimanager) {
        var _this = this;
        _super.prototype.configure.call(this, player, uimanager);
        var isVRConfigured = function () {
            // VR availability cannot be checked through getVRStatus() because it is asynchronously populated and not
            // available at UI initialization. As an alternative, we check the VR settings in the config.
            // TODO use getVRStatus() through isVRStereoAvailable() once the player has been rewritten and the status is
            // available in Ready
            var source = player.getSource();
            return source && Boolean(source.vr);
        };
        var isVRStereoAvailable = function () {
            var source = player.getSource();
            return player.vr && Boolean(source.vr);
        };
        var vrStateHandler = function (ev) {
            if (ev.type === player.exports.PlayerEvent.Warning
                && ev.code !== player.exports.WarningCode.VR_RENDERING_ERROR) {
                return;
            }
            if (isVRConfigured() && isVRStereoAvailable()) {
                _this.show(); // show button in case it is hidden
                if (player.vr && player.vr.getStereo()) {
                    _this.on();
                }
                else {
                    _this.off();
                }
            }
            else {
                _this.hide(); // hide button if no stereo mode available
            }
        };
        var vrButtonVisibilityHandler = function () {
            if (isVRConfigured()) {
                _this.show();
            }
            else {
                _this.hide();
            }
        };
        player.on(player.exports.PlayerEvent.VRStereoChanged, vrStateHandler);
        player.on(player.exports.PlayerEvent.Warning, vrStateHandler);
        // Hide button when VR source goes away
        player.on(player.exports.PlayerEvent.SourceUnloaded, vrButtonVisibilityHandler);
        uimanager.getConfig().events.onUpdated.subscribe(vrButtonVisibilityHandler);
        this.onClick.subscribe(function () {
            if (!isVRStereoAvailable()) {
                if (console) {
                    console.log('No VR content');
                }
            }
            else {
                if (player.vr && player.vr.getStereo()) {
                    player.vr.setStereo(false);
                }
                else {
                    player.vr.setStereo(true);
                }
            }
        });
        // Set startup visibility
        vrButtonVisibilityHandler();
    };
    return VRToggleButton;
}(togglebutton_1.ToggleButton));
exports.VRToggleButton = VRToggleButton;
},{"./togglebutton":65}],73:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var clickoverlay_1 = require("./clickoverlay");
/**
 * A watermark overlay with a clickable logo.
 */
var Watermark = /** @class */ (function (_super) {
    __extends(Watermark, _super);
    function Watermark(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-watermark',
            url: 'https://www.telecineplay.com.br',
        }, _this.config);
        return _this;
    }
    return Watermark;
}(clickoverlay_1.ClickOverlay));
exports.Watermark = Watermark;
},{"./clickoverlay":16}],74:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var settingstogglebutton_1 = require("./components/settingstogglebutton");
var volumeslider_1 = require("./components/volumeslider");
var playbacktimelabel_1 = require("./components/playbacktimelabel");
var airplaytogglebutton_1 = require("./components/airplaytogglebutton");
var errormessageoverlay_1 = require("./components/errormessageoverlay");
var controlbar_1 = require("./components/controlbar");
var casttogglebutton_1 = require("./components/casttogglebutton");
var fullscreentogglebutton_1 = require("./components/fullscreentogglebutton");
var recommendationoverlay_1 = require("./components/recommendationoverlay");
var playbackspeedselectbox_1 = require("./components/playbackspeedselectbox");
var audioqualityselectbox_1 = require("./components/audioqualityselectbox");
var caststatusoverlay_1 = require("./components/caststatusoverlay");
var uicontainer_1 = require("./components/uicontainer");
var subtitleoverlay_1 = require("./components/subtitleoverlay");
var settingspanel_1 = require("./components/settingspanel");
var seekbarlabel_1 = require("./components/seekbarlabel");
var playbacktoggleoverlay_1 = require("./components/playbacktoggleoverlay");
var pictureinpicturetogglebutton_1 = require("./components/pictureinpicturetogglebutton");
var spacer_1 = require("./components/spacer");
var container_1 = require("./components/container");
var volumetogglebutton_1 = require("./components/volumetogglebutton");
var playbacktogglebutton_1 = require("./components/playbacktogglebutton");
var seekbar_1 = require("./components/seekbar");
var videoqualityselectbox_1 = require("./components/videoqualityselectbox");
var uimanager_1 = require("./uimanager");
var titlebar_1 = require("./components/titlebar");
var bufferingoverlay_1 = require("./components/bufferingoverlay");
var subtitlelistbox_1 = require("./components/subtitlelistbox");
var audiotracklistbox_1 = require("./components/audiotracklistbox");
var settingspanelitem_1 = require("./components/settingspanelitem");
var settingspanelpage_1 = require("./components/settingspanelpage");
var uifactory_1 = require("./uifactory");
var DemoFactory;
(function (DemoFactory) {
    function buildDemoWithSeparateAudioSubtitlesButtons(player, config) {
        if (config === void 0) { config = {}; }
        // show smallScreen UI only on mobile/handheld devices
        var smallScreenSwitchWidth = 600;
        return new uimanager_1.UIManager(player, [
            {
                ui: uifactory_1.UIFactory.modernSmallScreenAdsUI(),
                condition: function (context) {
                    return (context.isMobile &&
                        context.documentWidth < smallScreenSwitchWidth &&
                        context.isAd &&
                        context.adRequiresUi);
                },
            },
            {
                ui: uifactory_1.UIFactory.modernAdsUI(),
                condition: function (context) {
                    return context.isAd && context.adRequiresUi;
                },
            },
            {
                ui: uifactory_1.UIFactory.modernSmallScreenUI(),
                condition: function (context) {
                    return (context.isMobile && context.documentWidth < smallScreenSwitchWidth);
                },
            },
            {
                ui: modernUIWithSeparateAudioSubtitlesButtons(),
            },
        ], config);
    }
    DemoFactory.buildDemoWithSeparateAudioSubtitlesButtons = buildDemoWithSeparateAudioSubtitlesButtons;
    function modernUIWithSeparateAudioSubtitlesButtons() {
        var subtitleOverlay = new subtitleoverlay_1.SubtitleOverlay();
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanelpage_1.SettingsPanelPage({
                    components: [
                        new settingspanelitem_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                        new settingspanelitem_1.SettingsPanelItem('Speed', new playbackspeedselectbox_1.PlaybackSpeedSelectBox()),
                        new settingspanelitem_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
                    ],
                }),
            ],
            hidden: true,
        });
        var subtitleListBox = new subtitlelistbox_1.SubtitleListBox();
        var subtitleSettingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanelpage_1.SettingsPanelPage({
                    components: [new settingspanelitem_1.SettingsPanelItem(null, subtitleListBox)],
                }),
            ],
            hidden: true,
        });
        subtitleListBox.onItemSelected.subscribe(function (_, value) {
            subtitleSettingsPanel.hide();
        });
        var audioTrackListBox = new audiotracklistbox_1.AudioTrackListBox();
        var audioTrackSettingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanelpage_1.SettingsPanelPage({
                    components: [new settingspanelitem_1.SettingsPanelItem(null, audioTrackListBox)],
                }),
            ],
            hidden: true,
        });
        audioTrackListBox.onItemSelected.subscribe(function (_, value) {
            audioTrackSettingsPanel.hide();
        });
        var controlBar = new controlbar_1.ControlBar({
            components: [
                audioTrackSettingsPanel,
                subtitleSettingsPanel,
                settingsPanel,
                new container_1.Container({
                    components: [
                        new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                        new playbacktimelabel_1.PlaybackTimeLabel({
                            timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.CurrentAndTotalTime,
                            cssClasses: ['text-right'],
                        }),
                    ],
                    cssClasses: ['controlbar-top'],
                }),
                new container_1.Container({
                    components: [
                        new playbacktogglebutton_1.PlaybackToggleButton(),
                        new volumetogglebutton_1.VolumeToggleButton(),
                        new volumeslider_1.VolumeSlider(),
                        new spacer_1.Spacer(),
                        new pictureinpicturetogglebutton_1.PictureInPictureToggleButton(),
                        new airplaytogglebutton_1.AirPlayToggleButton(),
                        new settingstogglebutton_1.SettingsToggleButton({
                            settingsPanel: audioTrackSettingsPanel,
                            cssClass: 'ui-audiotracksettingstogglebutton',
                        }),
                        new settingstogglebutton_1.SettingsToggleButton({
                            settingsPanel: subtitleSettingsPanel,
                            cssClass: 'ui-subtitlesettingstogglebutton',
                        }),
                        // new SettingsToggleButton({ settingsPanel: settingsPanel }),
                        new casttogglebutton_1.CastToggleButton(),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ],
                    cssClasses: ['controlbar-bottom'],
                }),
            ],
        });
        return new uicontainer_1.UIContainer({
            components: [
                subtitleOverlay,
                new bufferingoverlay_1.BufferingOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                controlBar,
                new titlebar_1.TitleBar(),
                new recommendationoverlay_1.RecommendationOverlay(),
                // new Watermark(),
                new errormessageoverlay_1.ErrorMessageOverlay(),
            ],
        });
    }
})(DemoFactory = exports.DemoFactory || (exports.DemoFactory = {}));
},{"./components/airplaytogglebutton":7,"./components/audioqualityselectbox":8,"./components/audiotracklistbox":9,"./components/bufferingoverlay":11,"./components/caststatusoverlay":13,"./components/casttogglebutton":14,"./components/container":19,"./components/controlbar":20,"./components/errormessageoverlay":21,"./components/fullscreentogglebutton":22,"./components/pictureinpicturetogglebutton":30,"./components/playbackspeedselectbox":31,"./components/playbacktimelabel":32,"./components/playbacktogglebutton":33,"./components/playbacktoggleoverlay":34,"./components/recommendationoverlay":35,"./components/seekbar":36,"./components/seekbarlabel":37,"./components/settingspanel":39,"./components/settingspanelitem":40,"./components/settingspanelpage":41,"./components/settingstogglebutton":45,"./components/spacer":46,"./components/subtitlelistbox":47,"./components/subtitleoverlay":48,"./components/titlebar":64,"./components/uicontainer":67,"./components/videoqualityselectbox":68,"./components/volumeslider":70,"./components/volumetogglebutton":71,"./uifactory":86,"./uimanager":87}],75:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Simple DOM manipulation and DOM element event handling modeled after jQuery (as replacement for jQuery).
 *
 * Like jQuery, DOM operates on single elements and lists of elements. For example: creating an element returns a DOM
 * instance with a single element, selecting elements returns a DOM instance with zero, one, or many elements. Similar
 * to jQuery, setters usually affect all elements, while getters operate on only the first element.
 * Also similar to jQuery, most methods (except getters) return the DOM instance facilitating easy chaining of method
 * calls.
 *
 * Built with the help of: http://youmightnotneedjquery.com/
 */
var DOM = /** @class */ (function () {
    function DOM(something, attributes) {
        this.document = document; // Set the global document to the local document field
        if (something instanceof Array) {
            if (something.length > 0 && something[0] instanceof HTMLElement) {
                var elements = something;
                this.elements = elements;
            }
        }
        else if (something instanceof HTMLElement) {
            var element = something;
            this.elements = [element];
        }
        else if (something instanceof Document) {
            // When a document is passed in, we do not do anything with it, but by setting this.elements to null
            // we give the event handling method a means to detect if the events should be registered on the document
            // instead of elements.
            this.elements = null;
        }
        else if (attributes) {
            var tagName = something;
            var element = document.createElement(tagName);
            for (var attributeName in attributes) {
                var attributeValue = attributes[attributeName];
                element.setAttribute(attributeName, attributeValue);
            }
            this.elements = [element];
        }
        else {
            var selector = something;
            this.elements = this.findChildElements(selector);
        }
    }
    Object.defineProperty(DOM.prototype, "length", {
        /**
         * Gets the number of elements that this DOM instance currently holds.
         * @returns {number} the number of elements
         */
        get: function () {
            return this.elements ? this.elements.length : 0;
        },
        enumerable: true,
        configurable: true
    });
    DOM.prototype.get = function (index) {
        if (index === undefined) {
            return this.elements;
        }
        else if (!this.elements || index >= this.elements.length || index < -this.elements.length) {
            return undefined;
        }
        else if (index < 0) {
            return this.elements[this.elements.length - index];
        }
        else {
            return this.elements[index];
        }
    };
    /**
     * A shortcut method for iterating all elements. Shorts this.elements.forEach(...) to this.forEach(...).
     * @param handler the handler to execute an operation on an element
     */
    DOM.prototype.forEach = function (handler) {
        if (!this.elements) {
            return;
        }
        this.elements.forEach(function (element) {
            handler(element);
        });
    };
    DOM.prototype.findChildElementsOfElement = function (element, selector) {
        var childElements = element.querySelectorAll(selector);
        // Convert NodeList to Array
        // https://toddmotto.com/a-comprehensive-dive-into-nodelists-arrays-converting-nodelists-and-understanding-the-dom/
        return [].slice.call(childElements);
    };
    DOM.prototype.findChildElements = function (selector) {
        var _this = this;
        var allChildElements = [];
        if (this.elements) {
            this.forEach(function (element) {
                allChildElements = allChildElements.concat(_this.findChildElementsOfElement(element, selector));
            });
        }
        else {
            return this.findChildElementsOfElement(document, selector);
        }
        return allChildElements;
    };
    /**
     * Finds all child elements of all elements matching the supplied selector.
     * @param selector the selector to match with child elements
     * @returns {DOM} a new DOM instance representing all matched children
     */
    DOM.prototype.find = function (selector) {
        var allChildElements = this.findChildElements(selector);
        return new DOM(allChildElements);
    };
    DOM.prototype.html = function (content) {
        if (arguments.length > 0) {
            return this.setHtml(content);
        }
        else {
            return this.getHtml();
        }
    };
    DOM.prototype.getHtml = function () {
        return this.elements[0].innerHTML;
    };
    DOM.prototype.setHtml = function (content) {
        if (content === undefined || content == null) {
            // Set to empty string to avoid innerHTML getting set to 'undefined' (all browsers) or 'null' (IE9)
            content = '';
        }
        this.forEach(function (element) {
            element.innerHTML = content;
        });
        return this;
    };
    /**
     * Clears the inner HTML of all elements (deletes all children).
     * @returns {DOM}
     */
    DOM.prototype.empty = function () {
        this.forEach(function (element) {
            element.innerHTML = '';
        });
        return this;
    };
    /**
     * Returns the current value of the first form element, e.g. the selected value of a select box or the text if an
     * input field.
     * @returns {string} the value of a form element
     */
    DOM.prototype.val = function () {
        var element = this.elements[0];
        if (element instanceof HTMLSelectElement || element instanceof HTMLInputElement) {
            return element.value;
        }
        else {
            // TODO add support for missing form elements
            throw new Error("val() not supported for " + typeof element);
        }
    };
    DOM.prototype.attr = function (attribute, value) {
        if (arguments.length > 1) {
            return this.setAttr(attribute, value);
        }
        else {
            return this.getAttr(attribute);
        }
    };
    DOM.prototype.getAttr = function (attribute) {
        return this.elements[0].getAttribute(attribute);
    };
    DOM.prototype.setAttr = function (attribute, value) {
        this.forEach(function (element) {
            element.setAttribute(attribute, value);
        });
        return this;
    };
    DOM.prototype.data = function (dataAttribute, value) {
        if (arguments.length > 1) {
            return this.setData(dataAttribute, value);
        }
        else {
            return this.getData(dataAttribute);
        }
    };
    DOM.prototype.getData = function (dataAttribute) {
        return this.elements[0].getAttribute('data-' + dataAttribute);
    };
    DOM.prototype.setData = function (dataAttribute, value) {
        this.forEach(function (element) {
            element.setAttribute('data-' + dataAttribute, value);
        });
        return this;
    };
    /**
     * Appends one or more DOM elements as children to all elements.
     * @param childElements the chrild elements to append
     * @returns {DOM}
     */
    DOM.prototype.append = function () {
        var childElements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            childElements[_i] = arguments[_i];
        }
        this.forEach(function (element) {
            childElements.forEach(function (childElement) {
                childElement.elements.forEach(function (_, index) {
                    element.appendChild(childElement.elements[index]);
                });
            });
        });
        return this;
    };
    /**
     * Removes all elements from the DOM.
     */
    DOM.prototype.remove = function () {
        this.forEach(function (element) {
            var parent = element.parentNode;
            if (parent) {
                parent.removeChild(element);
            }
        });
    };
    /**
     * Returns the offset of the first element from the document's top left corner.
     * @returns {Offset}
     */
    DOM.prototype.offset = function () {
        var element = this.elements[0];
        var elementRect = element.getBoundingClientRect();
        var htmlRect = document.body.parentElement.getBoundingClientRect();
        // Virtual viewport scroll handling (e.g. pinch zoomed viewports in mobile browsers or desktop Chrome/Edge)
        // 'normal' zooms and virtual viewport zooms (aka layout viewport) result in different
        // element.getBoundingClientRect() results:
        //  - with normal scrolls, the clientRect decreases with an increase in scroll(Top|Left)/page(X|Y)Offset
        //  - with pinch zoom scrolls, the clientRect stays the same while scroll/pageOffset changes
        // This means, that the combination of clientRect + scroll/pageOffset does not work to calculate the offset
        // from the document's upper left origin when pinch zoom is used.
        // To work around this issue, we do not use scroll/pageOffset but get the clientRect of the html element and
        // subtract it from the element's rect, which always results in the offset from the document origin.
        // NOTE: the current way of offset calculation was implemented specifically to track event positions on the
        // seek bar, and it might break compatibility with jQuery's offset() method. If this ever turns out to be a
        // problem, this method should be reverted to the old version and the offset calculation moved to the seek bar.
        return {
            top: elementRect.top - htmlRect.top,
            left: elementRect.left - htmlRect.left,
        };
    };
    /**
     * Returns the width of the first element.
     * @returns {number} the width of the first element
     */
    DOM.prototype.width = function () {
        // TODO check if this is the same as jQuery's width() (probably not)
        return this.elements[0].offsetWidth;
    };
    /**
     * Returns the height of the first element.
     * @returns {number} the height of the first element
     */
    DOM.prototype.height = function () {
        // TODO check if this is the same as jQuery's height() (probably not)
        return this.elements[0].offsetHeight;
    };
    /**
     * Attaches an event handler to one or more events on all elements.
     * @param eventName the event name (or multiple names separated by space) to listen to
     * @param eventHandler the event handler to call when the event fires
     * @returns {DOM}
     */
    DOM.prototype.on = function (eventName, eventHandler) {
        var _this = this;
        var events = eventName.split(' ');
        events.forEach(function (event) {
            if (_this.elements == null) {
                _this.document.addEventListener(event, eventHandler);
            }
            else {
                _this.forEach(function (element) {
                    element.addEventListener(event, eventHandler);
                });
            }
        });
        return this;
    };
    /**
     * Removes an event handler from one or more events on all elements.
     * @param eventName the event name (or multiple names separated by space) to remove the handler from
     * @param eventHandler the event handler to remove
     * @returns {DOM}
     */
    DOM.prototype.off = function (eventName, eventHandler) {
        var _this = this;
        var events = eventName.split(' ');
        events.forEach(function (event) {
            if (_this.elements == null) {
                _this.document.removeEventListener(event, eventHandler);
            }
            else {
                _this.forEach(function (element) {
                    element.removeEventListener(event, eventHandler);
                });
            }
        });
        return this;
    };
    /**
     * Adds the specified class(es) to all elements.
     * @param className the class(es) to add, multiple classes separated by space
     * @returns {DOM}
     */
    DOM.prototype.addClass = function (className) {
        this.forEach(function (element) {
            var _a;
            if (element.classList) {
                var classNames = className.split(' ')
                    .filter(function (className) { return className.length > 0; });
                if (classNames.length > 0) {
                    (_a = element.classList).add.apply(_a, classNames);
                }
            }
            else {
                element.className += ' ' + className;
            }
        });
        return this;
    };
    /**
     * Removed the specified class(es) from all elements.
     * @param className the class(es) to remove, multiple classes separated by space
     * @returns {DOM}
     */
    DOM.prototype.removeClass = function (className) {
        this.forEach(function (element) {
            var _a;
            if (element.classList) {
                var classNames = className.split(' ')
                    .filter(function (className) { return className.length > 0; });
                if (classNames.length > 0) {
                    (_a = element.classList).remove.apply(_a, classNames);
                }
            }
            else {
                element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        });
        return this;
    };
    /**
     * Checks if any of the elements has the specified class.
     * @param className the class name to check
     * @returns {boolean} true if one of the elements has the class attached, else if no element has it attached
     */
    DOM.prototype.hasClass = function (className) {
        var hasClass = false;
        this.forEach(function (element) {
            if (element.classList) {
                if (element.classList.contains(className)) {
                    // Since we are inside a handler, we can't just 'return true'. Instead, we save it to a variable
                    // and return it at the end of the function body.
                    hasClass = true;
                }
            }
            else {
                if (new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className)) {
                    // See comment above
                    hasClass = true;
                }
            }
        });
        return hasClass;
    };
    DOM.prototype.css = function (propertyNameOrCollection, value) {
        if (typeof propertyNameOrCollection === 'string') {
            var propertyName = propertyNameOrCollection;
            if (arguments.length === 2) {
                return this.setCss(propertyName, value);
            }
            else {
                return this.getCss(propertyName);
            }
        }
        else {
            var propertyValueCollection = propertyNameOrCollection;
            return this.setCssCollection(propertyValueCollection);
        }
    };
    DOM.prototype.getCss = function (propertyName) {
        return getComputedStyle(this.elements[0])[propertyName];
    };
    DOM.prototype.setCss = function (propertyName, value) {
        this.forEach(function (element) {
            // <any> cast to resolve TS7015: http://stackoverflow.com/a/36627114/370252
            element.style[propertyName] = value;
        });
        return this;
    };
    DOM.prototype.setCssCollection = function (ruleValueCollection) {
        this.forEach(function (element) {
            // http://stackoverflow.com/a/34490573/370252
            Object.assign(element.style, ruleValueCollection);
        });
        return this;
    };
    return DOM;
}());
exports.DOM = DOM;
},{}],76:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorUtils;
(function (ErrorUtils) {
    ErrorUtils.defaultErrorMessages = {
        1000: 'Erro TCP5-1000' + "<br>" + 'Tente assistir ao filme mais tarde. Se o problema continuar, acesse a nossa central de ajuda e fale com a gente.',
        1001: 'Erro TCP5-1001' + "<br>" + 'Esse é um erro temporário, por favor, faça logoff da sua conta e entre de novo. Se mesmo assim o erro continuar, acesse a nossa central de ajuda.',
        1100: 'Erro TCP5-1100' + "<br>" + 'Tente assistir ao filme mais tarde. Se o problema continuar, acesse a nossa central de ajuda e fale com a gente.',
        1101: 'Erro TCP5-1101' + "<br>" + 'Tente assistir ao filme mais tarde. Se o problema continuar, acesse a nossa central de ajuda e fale com a gente.',
        1102: 'Erro TCP5-1102' + "<br>" + 'Tente assistir ao filme mais tarde. Se o problema continuar, acesse a nossa central de ajuda e fale com a gente.',
        1103: 'Erro TCP5-1103' + "<br>" + 'Tente assistir ao filme mais tarde. Se o problema continuar, acesse a nossa central de ajuda e fale com a gente.',
        1104: 'Erro TCP5-1104' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1105: 'Erro TCP5-1105' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1106: 'Erro TCP5-1106' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1107: 'Erro TCP5-1107' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1108: 'Erro TCP5-1108' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1109: 'Erro TCP5-1109' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1110: 'Erro TCP5-1110' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1111: 'Erro TCP5-1111' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1112: 'Erro TCP5-1112' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1113: 'Erro TCP5-1113' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro e o nome do filme.',
        1200: 'Erro TCP5-1200' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1201: 'Erro TCP5-1201' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1202: 'Erro TCP5-1202' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1203: 'Erro TCP5-1203' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        1204: 'Erro TCP5-1204' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        1205: 'Erro TCP5-1205' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        1206: 'Erro TCP5-1206' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        1207: 'Erro TCP5-1207' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro e o nome do filme.',
        1208: 'Erro TCP5-1208' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1209: 'Erro TCP5-1209' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1210: 'Erro TCP5-1210' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1211: 'Erro TCP5-1211' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1300: 'Erro TCP5-1300' + "<br>" + 'Tente assistir ao filme mais tarde. Se o problema continuar, acesse a nossa central de ajuda e fale com a gente.',
        1301: 'Erro TCP5-1301' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1302: 'Erro TCP5-1302' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1303: 'Erro TCP5-1303' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1304: 'Erro TCP5-1304' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        1400: 'Erro TCP5-1400' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1401: 'Erro TCP5-1401' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1402: 'Erro TCP5-1402' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        1403: 'Erro TCP5-1403' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        1404: 'Erro TCP5-1404' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        2000: 'Erro TCP5-2000' + "<br>" + 'Esse é um erro temporário, por favor, faça logoff da sua conta e entre novamente. Se mesmo assim o erro continuar, acesse a nossa central de ajuda. ',
        2001: 'Erro TCP5-2001' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        2002: 'Erro TCP5-2002' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        2003: 'Erro TCP5-2003' + "<br>" + 'Esse é um erro temporário, por favor, faça logoff da sua conta e entre novamente. Se mesmo assim o erro continuar, acesse a nossa central de ajuda. ',
        2004: 'Erro TCP5-2004' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro e o nome do filme.',
        2005: 'Erro TCP5-2005' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        2006: 'Erro TCP5-2006' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        2007: 'Erro TCP5-2007' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro e o nome do filme.',
        2008: 'Erro TCP5-2008' + "<br>" + 'Navegador de internet não suportado. Por favor, assista ao filme usando outro navegador. Se o erro continuar, acesse a nossa central de ajuda.',
        2009: 'Erro TCP5-2009' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        2010: 'Erro TCP5-2010' + "<br>" + 'Você está usando um sistema operacional não suportado. Clique aqui e confira em quais sistemas você pode assistir ao filme. ',
        2011: 'Erro TCP5-2011' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        2012: 'Erro TCP5-2012' + "<br>" + 'Reinicie a sua conexão com a internet, atualize a página e tente assistir ao filme de novo. Se o problema continuar, acesse a nossa central de ajuda.',
        2013: 'Erro TCP5-2013' + "<br>" + 'Dispositivo não suportado. Clique aqui e veja em quais dispositivos você pode assistir ao filme.',
        2014: 'Erro TCP5-2014' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        2100: 'Erro TCP5-2100' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        2101: 'Erro TCP5-2101' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        3000: 'Erro TCP5-3000' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        3001: 'Erro TCP5-3001' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        3002: 'Erro TCP5-3002' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        3003: 'Erro TCP5-3003' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        3004: 'Erro TCP5-3004' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
        3100: 'Erro TCP5-3100' + "<br>" + 'Por favor, acesse a nossa central de ajuda e fale com a gente informando o erro.',
    };
    ErrorUtils.defaultErrorMessageTranslator = function (error) {
        var errorMessage = ErrorUtils.defaultErrorMessages[error.code];
        if (errorMessage) {
            // Use the error message text if there is one
            // return `${errorMessage}\n(${error.name})`; // default error message style
            return "" + errorMessage; // default error message style
        }
        else {
            // Fallback to error code/name if no message is defined
            return error.code + " " + error.name;
        }
    };
})(ErrorUtils = exports.ErrorUtils || (exports.ErrorUtils = {}));
},{}],77:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var arrayutils_1 = require("./arrayutils");
var timeout_1 = require("./timeout");
/**
 * Event dispatcher to subscribe and trigger events. Each event should have its own dispatcher.
 */
var EventDispatcher = /** @class */ (function () {
    function EventDispatcher() {
        this.listeners = [];
    }
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.subscribe = function (listener) {
        this.listeners.push(new EventListenerWrapper(listener));
    };
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.subscribeOnce = function (listener) {
        this.listeners.push(new EventListenerWrapper(listener, true));
    };
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.subscribeRateLimited = function (listener, rateMs) {
        this.listeners.push(new RateLimitedEventListenerWrapper(listener, rateMs));
    };
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.unsubscribe = function (listener) {
        // Iterate through listeners, compare with parameter, and remove if found
        // NOTE: In case we ever remove all matching listeners instead of just the first, we need to reverse-iterate here
        for (var i = 0; i < this.listeners.length; i++) {
            var subscribedListener = this.listeners[i];
            if (subscribedListener.listener === listener) {
                subscribedListener.clear();
                arrayutils_1.ArrayUtils.remove(this.listeners, subscribedListener);
                return true;
            }
        }
        return false;
    };
    /**
     * Removes all listeners from this dispatcher.
     */
    EventDispatcher.prototype.unsubscribeAll = function () {
        // In case of RateLimitedEventListenerWrapper we need to make sure that the timeout callback won't be called
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener.clear();
        }
        this.listeners = [];
    };
    /**
     * Dispatches an event to all subscribed listeners.
     * @param sender the source of the event
     * @param args the arguments for the event
     */
    EventDispatcher.prototype.dispatch = function (sender, args) {
        if (args === void 0) { args = null; }
        var listenersToRemove = [];
        // Call every listener
        // We iterate over a copy of the array of listeners to avoid the case where events are not fired on listeners when
        // listeners are unsubscribed from within the event handlers during a dispatch (because the indices change and
        // listeners are shifted within the array).
        // This means that listener x+1 will still be called if unsubscribed from within the handler of listener x, as well
        // as listener y+1 will not be called when subscribed from within the handler of listener y.
        // Array.slice(0) is the fastest array copy method according to: https://stackoverflow.com/a/21514254/370252
        var listeners = this.listeners.slice(0);
        for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
            var listener = listeners_1[_i];
            listener.fire(sender, args);
            if (listener.isOnce()) {
                listenersToRemove.push(listener);
            }
        }
        // Remove one-time listener
        for (var _a = 0, listenersToRemove_1 = listenersToRemove; _a < listenersToRemove_1.length; _a++) {
            var listenerToRemove = listenersToRemove_1[_a];
            arrayutils_1.ArrayUtils.remove(this.listeners, listenerToRemove);
        }
    };
    /**
     * Returns the event that this dispatcher manages and on which listeners can subscribe and unsubscribe event handlers.
     * @returns {Event}
     */
    EventDispatcher.prototype.getEvent = function () {
        // For now, just cast the event dispatcher to the event interface. At some point in the future when the
        // codebase grows, it might make sense to split the dispatcher into separate dispatcher and event classes.
        return this;
    };
    return EventDispatcher;
}());
exports.EventDispatcher = EventDispatcher;
/**
 * A basic event listener wrapper to manage listeners within the {@link EventDispatcher}. This is a 'private' class
 * for internal dispatcher use and it is therefore not exported.
 */
var EventListenerWrapper = /** @class */ (function () {
    function EventListenerWrapper(listener, once) {
        if (once === void 0) { once = false; }
        this.eventListener = listener;
        this.once = once;
    }
    Object.defineProperty(EventListenerWrapper.prototype, "listener", {
        /**
         * Returns the wrapped event listener.
         * @returns {EventListener<Sender, Args>}
         */
        get: function () {
            return this.eventListener;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Fires the wrapped event listener with the given arguments.
     * @param sender
     * @param args
     */
    EventListenerWrapper.prototype.fire = function (sender, args) {
        this.eventListener(sender, args);
    };
    /**
     * Checks if this listener is scheduled to be called only once.
     * @returns {boolean} once if true
     */
    EventListenerWrapper.prototype.isOnce = function () {
        return this.once;
    };
    EventListenerWrapper.prototype.clear = function () {
    };
    return EventListenerWrapper;
}());
/**
 * Extends the basic {@link EventListenerWrapper} with rate-limiting functionality.
 */
var RateLimitedEventListenerWrapper = /** @class */ (function (_super) {
    __extends(RateLimitedEventListenerWrapper, _super);
    function RateLimitedEventListenerWrapper(listener, rateMs) {
        var _this = _super.call(this, listener) || this;
        _this.rateMs = rateMs;
        // starting limiting the events to the given value
        var startRateLimiting = function () {
            _this.rateLimitTimout.start();
        };
        // timout for limiting the events
        _this.rateLimitTimout = new timeout_1.Timeout(_this.rateMs, function () {
            if (_this.lastSeenEvent) {
                _this.fireSuper(_this.lastSeenEvent.sender, _this.lastSeenEvent.args);
                startRateLimiting(); // start rateLimiting again to keep rate limit active even after firing the last seen event
                _this.lastSeenEvent = null;
            }
        });
        // In case the events stopping during the rateLimiting we need to track the last seen one and delegate after the
        // rate limiting is finished. This prevents missing the last update due to the rate limit.
        _this.rateLimitingEventListener = function (sender, args) {
            // only fire events if the rateLimiting is not running
            if (_this.shouldFireEvent()) {
                _this.fireSuper(sender, args);
                startRateLimiting();
                return;
            }
            _this.lastSeenEvent = {
                sender: sender,
                args: args,
            };
        };
        return _this;
    }
    RateLimitedEventListenerWrapper.prototype.shouldFireEvent = function () {
        return !this.rateLimitTimout.isActive();
    };
    RateLimitedEventListenerWrapper.prototype.fireSuper = function (sender, args) {
        // Fire the actual external event listener
        _super.prototype.fire.call(this, sender, args);
    };
    RateLimitedEventListenerWrapper.prototype.fire = function (sender, args) {
        // Fire the internal rate-limiting listener instead of the external event listener
        this.rateLimitingEventListener(sender, args);
    };
    RateLimitedEventListenerWrapper.prototype.clear = function () {
        _super.prototype.clear.call(this);
        this.rateLimitTimout.clear();
    };
    return RateLimitedEventListenerWrapper;
}(EventListenerWrapper));
},{"./arrayutils":1,"./timeout":85}],78:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Guid;
(function (Guid) {
    var guid = 1;
    function next() {
        return guid++;
    }
    Guid.next = next;
})(Guid = exports.Guid || (exports.Guid = {}));
},{}],79:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("./dom");
/**
 * Tracks the loading state of images.
 */
var ImageLoader = /** @class */ (function () {
    function ImageLoader() {
        this.state = {};
    }
    /**
     * Loads an image and call the callback once the image is loaded. If the image is already loaded, the callback
     * is called immediately, else it is called once loading has finished. Calling this method multiple times for the
     * same image while it is loading calls only let callback passed into the last call.
     * @param url The url to the image to load
     * @param loadedCallback The callback that is called when the image is loaded
     */
    ImageLoader.prototype.load = function (url, loadedCallback) {
        var _this = this;
        if (!this.state[url]) {
            // When the image was never attempted to be loaded before, we create a state and store it in the state map
            // for later use when the same image is requested to be loaded again.
            var state_1 = {
                url: url,
                image: new dom_1.DOM('img', {}),
                loadedCallback: loadedCallback,
                loaded: false,
                width: 0,
                height: 0,
            };
            this.state[url] = state_1;
            // Listen to the load event, update the state and call the callback once the image is loaded
            state_1.image.on('load', function (e) {
                state_1.loaded = true;
                state_1.width = state_1.image.get(0).width;
                state_1.height = state_1.image.get(0).height;
                _this.callLoadedCallback(state_1);
            });
            // Set the image URL to start the loading
            state_1.image.attr('src', state_1.url);
        }
        else {
            // We have a state for the requested image, so it is either already loaded or currently loading
            var state = this.state[url];
            // We overwrite the callback to make sure that only the callback of the latest call gets executed.
            // Earlier callbacks become invalid once a new load call arrives, and they are not called as long as the image
            // is not loaded.
            state.loadedCallback = loadedCallback;
            // When the image is already loaded, we directly execute the callback instead of waiting for the load event
            if (state.loaded) {
                this.callLoadedCallback(state);
            }
        }
    };
    ImageLoader.prototype.callLoadedCallback = function (state) {
        state.loadedCallback(state.url, state.width, state.height);
    };
    return ImageLoader;
}());
exports.ImageLoader = ImageLoader;
},{"./dom":75}],80:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = '3.4.2';
// Management
var uimanager_1 = require("./uimanager");
exports.UIManager = uimanager_1.UIManager;
exports.UIInstanceManager = uimanager_1.UIInstanceManager;
// Factories
var uifactory_1 = require("./uifactory");
exports.UIFactory = uifactory_1.UIFactory;
var demofactory_1 = require("./demofactory");
exports.DemoFactory = demofactory_1.DemoFactory;
// Utils
var arrayutils_1 = require("./arrayutils");
exports.ArrayUtils = arrayutils_1.ArrayUtils;
var stringutils_1 = require("./stringutils");
exports.StringUtils = stringutils_1.StringUtils;
var playerutils_1 = require("./playerutils");
exports.PlayerUtils = playerutils_1.PlayerUtils;
var uiutils_1 = require("./uiutils");
exports.UIUtils = uiutils_1.UIUtils;
var browserutils_1 = require("./browserutils");
exports.BrowserUtils = browserutils_1.BrowserUtils;
var storageutils_1 = require("./storageutils");
exports.StorageUtils = storageutils_1.StorageUtils;
var errorutils_1 = require("./errorutils");
exports.ErrorUtils = errorutils_1.ErrorUtils;
// Components
var button_1 = require("./components/button");
exports.Button = button_1.Button;
var controlbar_1 = require("./components/controlbar");
exports.ControlBar = controlbar_1.ControlBar;
var fullscreentogglebutton_1 = require("./components/fullscreentogglebutton");
exports.FullscreenToggleButton = fullscreentogglebutton_1.FullscreenToggleButton;
var hugeplaybacktogglebutton_1 = require("./components/hugeplaybacktogglebutton");
exports.HugePlaybackToggleButton = hugeplaybacktogglebutton_1.HugePlaybackToggleButton;
var playbacktimelabel_1 = require("./components/playbacktimelabel");
exports.PlaybackTimeLabel = playbacktimelabel_1.PlaybackTimeLabel;
exports.PlaybackTimeLabelMode = playbacktimelabel_1.PlaybackTimeLabelMode;
var playbacktogglebutton_1 = require("./components/playbacktogglebutton");
exports.PlaybackToggleButton = playbacktogglebutton_1.PlaybackToggleButton;
var seekbar_1 = require("./components/seekbar");
exports.SeekBar = seekbar_1.SeekBar;
var selectbox_1 = require("./components/selectbox");
exports.SelectBox = selectbox_1.SelectBox;
var itemselectionlist_1 = require("./components/itemselectionlist");
exports.ItemSelectionList = itemselectionlist_1.ItemSelectionList;
var settingspanel_1 = require("./components/settingspanel");
exports.SettingsPanel = settingspanel_1.SettingsPanel;
var settingstogglebutton_1 = require("./components/settingstogglebutton");
exports.SettingsToggleButton = settingstogglebutton_1.SettingsToggleButton;
var togglebutton_1 = require("./components/togglebutton");
exports.ToggleButton = togglebutton_1.ToggleButton;
var videoqualityselectbox_1 = require("./components/videoqualityselectbox");
exports.VideoQualitySelectBox = videoqualityselectbox_1.VideoQualitySelectBox;
var volumetogglebutton_1 = require("./components/volumetogglebutton");
exports.VolumeToggleButton = volumetogglebutton_1.VolumeToggleButton;
var vrtogglebutton_1 = require("./components/vrtogglebutton");
exports.VRToggleButton = vrtogglebutton_1.VRToggleButton;
var watermark_1 = require("./components/watermark");
exports.Watermark = watermark_1.Watermark;
var uicontainer_1 = require("./components/uicontainer");
exports.UIContainer = uicontainer_1.UIContainer;
var container_1 = require("./components/container");
exports.Container = container_1.Container;
var label_1 = require("./components/label");
exports.Label = label_1.Label;
var audioqualityselectbox_1 = require("./components/audioqualityselectbox");
exports.AudioQualitySelectBox = audioqualityselectbox_1.AudioQualitySelectBox;
var audiotrackselectbox_1 = require("./components/audiotrackselectbox");
exports.AudioTrackSelectBox = audiotrackselectbox_1.AudioTrackSelectBox;
var caststatusoverlay_1 = require("./components/caststatusoverlay");
exports.CastStatusOverlay = caststatusoverlay_1.CastStatusOverlay;
var casttogglebutton_1 = require("./components/casttogglebutton");
exports.CastToggleButton = casttogglebutton_1.CastToggleButton;
var component_1 = require("./components/component");
exports.Component = component_1.Component;
var errormessageoverlay_1 = require("./components/errormessageoverlay");
exports.ErrorMessageOverlay = errormessageoverlay_1.ErrorMessageOverlay;
var recommendationoverlay_1 = require("./components/recommendationoverlay");
exports.RecommendationOverlay = recommendationoverlay_1.RecommendationOverlay;
var seekbarlabel_1 = require("./components/seekbarlabel");
exports.SeekBarLabel = seekbarlabel_1.SeekBarLabel;
var subtitleoverlay_1 = require("./components/subtitleoverlay");
exports.SubtitleOverlay = subtitleoverlay_1.SubtitleOverlay;
var subtitleselectbox_1 = require("./components/subtitleselectbox");
exports.SubtitleSelectBox = subtitleselectbox_1.SubtitleSelectBox;
var titlebar_1 = require("./components/titlebar");
exports.TitleBar = titlebar_1.TitleBar;
var volumecontrolbutton_1 = require("./components/volumecontrolbutton");
exports.VolumeControlButton = volumecontrolbutton_1.VolumeControlButton;
var clickoverlay_1 = require("./components/clickoverlay");
exports.ClickOverlay = clickoverlay_1.ClickOverlay;
var adskipbutton_1 = require("./components/adskipbutton");
exports.AdSkipButton = adskipbutton_1.AdSkipButton;
var admessagelabel_1 = require("./components/admessagelabel");
exports.AdMessageLabel = admessagelabel_1.AdMessageLabel;
var adclickoverlay_1 = require("./components/adclickoverlay");
exports.AdClickOverlay = adclickoverlay_1.AdClickOverlay;
var playbackspeedselectbox_1 = require("./components/playbackspeedselectbox");
exports.PlaybackSpeedSelectBox = playbackspeedselectbox_1.PlaybackSpeedSelectBox;
var hugereplaybutton_1 = require("./components/hugereplaybutton");
exports.HugeReplayButton = hugereplaybutton_1.HugeReplayButton;
var bufferingoverlay_1 = require("./components/bufferingoverlay");
exports.BufferingOverlay = bufferingoverlay_1.BufferingOverlay;
var castuicontainer_1 = require("./components/castuicontainer");
exports.CastUIContainer = castuicontainer_1.CastUIContainer;
var playbacktoggleoverlay_1 = require("./components/playbacktoggleoverlay");
exports.PlaybackToggleOverlay = playbacktoggleoverlay_1.PlaybackToggleOverlay;
var closebutton_1 = require("./components/closebutton");
exports.CloseButton = closebutton_1.CloseButton;
var metadatalabel_1 = require("./components/metadatalabel");
exports.MetadataLabel = metadatalabel_1.MetadataLabel;
exports.MetadataLabelContent = metadatalabel_1.MetadataLabelContent;
var airplaytogglebutton_1 = require("./components/airplaytogglebutton");
exports.AirPlayToggleButton = airplaytogglebutton_1.AirPlayToggleButton;
var volumeslider_1 = require("./components/volumeslider");
exports.VolumeSlider = volumeslider_1.VolumeSlider;
var pictureinpicturetogglebutton_1 = require("./components/pictureinpicturetogglebutton");
exports.PictureInPictureToggleButton = pictureinpicturetogglebutton_1.PictureInPictureToggleButton;
var spacer_1 = require("./components/spacer");
exports.Spacer = spacer_1.Spacer;
var backgroundcolorselectbox_1 = require("./components/subtitlesettings/backgroundcolorselectbox");
exports.BackgroundColorSelectBox = backgroundcolorselectbox_1.BackgroundColorSelectBox;
var backgroundopacityselectbox_1 = require("./components/subtitlesettings/backgroundopacityselectbox");
exports.BackgroundOpacitySelectBox = backgroundopacityselectbox_1.BackgroundOpacitySelectBox;
var characteredgeselectbox_1 = require("./components/subtitlesettings/characteredgeselectbox");
exports.CharacterEdgeSelectBox = characteredgeselectbox_1.CharacterEdgeSelectBox;
var fontcolorselectbox_1 = require("./components/subtitlesettings/fontcolorselectbox");
exports.FontColorSelectBox = fontcolorselectbox_1.FontColorSelectBox;
var fontfamilyselectbox_1 = require("./components/subtitlesettings/fontfamilyselectbox");
exports.FontFamilySelectBox = fontfamilyselectbox_1.FontFamilySelectBox;
var fontopacityselectbox_1 = require("./components/subtitlesettings/fontopacityselectbox");
exports.FontOpacitySelectBox = fontopacityselectbox_1.FontOpacitySelectBox;
var fontsizeselectbox_1 = require("./components/subtitlesettings/fontsizeselectbox");
exports.FontSizeSelectBox = fontsizeselectbox_1.FontSizeSelectBox;
var subtitlesettingselectbox_1 = require("./components/subtitlesettings/subtitlesettingselectbox");
exports.SubtitleSettingSelectBox = subtitlesettingselectbox_1.SubtitleSettingSelectBox;
var subtitlesettingslabel_1 = require("./components/subtitlesettings/subtitlesettingslabel");
exports.SubtitleSettingsLabel = subtitlesettingslabel_1.SubtitleSettingsLabel;
var windowcolorselectbox_1 = require("./components/subtitlesettings/windowcolorselectbox");
exports.WindowColorSelectBox = windowcolorselectbox_1.WindowColorSelectBox;
var windowopacityselectbox_1 = require("./components/subtitlesettings/windowopacityselectbox");
exports.WindowOpacitySelectBox = windowopacityselectbox_1.WindowOpacitySelectBox;
var subtitlesettingsresetbutton_1 = require("./components/subtitlesettings/subtitlesettingsresetbutton");
exports.SubtitleSettingsResetButton = subtitlesettingsresetbutton_1.SubtitleSettingsResetButton;
var listbox_1 = require("./components/listbox");
exports.ListBox = listbox_1.ListBox;
var subtitlelistbox_1 = require("./components/subtitlelistbox");
exports.SubtitleListBox = subtitlelistbox_1.SubtitleListBox;
var audiotracklistbox_1 = require("./components/audiotracklistbox");
exports.AudioTrackListBox = audiotracklistbox_1.AudioTrackListBox;
var settingspanelpage_1 = require("./components/settingspanelpage");
exports.SettingsPanelPage = settingspanelpage_1.SettingsPanelPage;
var settingspanelpagebackbutton_1 = require("./components/settingspanelpagebackbutton");
exports.SettingsPanelPageBackButton = settingspanelpagebackbutton_1.SettingsPanelPageBackButton;
var settingspanelpageopenbutton_1 = require("./components/settingspanelpageopenbutton");
exports.SettingsPanelPageOpenButton = settingspanelpageopenbutton_1.SettingsPanelPageOpenButton;
var subtitlesettingspanelpage_1 = require("./components/subtitlesettings/subtitlesettingspanelpage");
exports.SubtitleSettingsPanelPage = subtitlesettingspanelpage_1.SubtitleSettingsPanelPage;
var settingspanelitem_1 = require("./components/settingspanelitem");
exports.SettingsPanelItem = settingspanelitem_1.SettingsPanelItem;
// Object.assign polyfill for ES5/IE9
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}
},{"./arrayutils":1,"./browserutils":3,"./components/adclickoverlay":4,"./components/admessagelabel":5,"./components/adskipbutton":6,"./components/airplaytogglebutton":7,"./components/audioqualityselectbox":8,"./components/audiotracklistbox":9,"./components/audiotrackselectbox":10,"./components/bufferingoverlay":11,"./components/button":12,"./components/caststatusoverlay":13,"./components/casttogglebutton":14,"./components/castuicontainer":15,"./components/clickoverlay":16,"./components/closebutton":17,"./components/component":18,"./components/container":19,"./components/controlbar":20,"./components/errormessageoverlay":21,"./components/fullscreentogglebutton":22,"./components/hugeplaybacktogglebutton":23,"./components/hugereplaybutton":24,"./components/itemselectionlist":25,"./components/label":26,"./components/listbox":27,"./components/metadatalabel":29,"./components/pictureinpicturetogglebutton":30,"./components/playbackspeedselectbox":31,"./components/playbacktimelabel":32,"./components/playbacktogglebutton":33,"./components/playbacktoggleoverlay":34,"./components/recommendationoverlay":35,"./components/seekbar":36,"./components/seekbarlabel":37,"./components/selectbox":38,"./components/settingspanel":39,"./components/settingspanelitem":40,"./components/settingspanelpage":41,"./components/settingspanelpagebackbutton":42,"./components/settingspanelpageopenbutton":44,"./components/settingstogglebutton":45,"./components/spacer":46,"./components/subtitlelistbox":47,"./components/subtitleoverlay":48,"./components/subtitleselectbox":49,"./components/subtitlesettings/backgroundcolorselectbox":50,"./components/subtitlesettings/backgroundopacityselectbox":51,"./components/subtitlesettings/characteredgeselectbox":52,"./components/subtitlesettings/fontcolorselectbox":53,"./components/subtitlesettings/fontfamilyselectbox":54,"./components/subtitlesettings/fontopacityselectbox":55,"./components/subtitlesettings/fontsizeselectbox":56,"./components/subtitlesettings/subtitlesettingselectbox":57,"./components/subtitlesettings/subtitlesettingslabel":58,"./components/subtitlesettings/subtitlesettingspanelpage":60,"./components/subtitlesettings/subtitlesettingsresetbutton":61,"./components/subtitlesettings/windowcolorselectbox":62,"./components/subtitlesettings/windowopacityselectbox":63,"./components/titlebar":64,"./components/togglebutton":65,"./components/uicontainer":67,"./components/videoqualityselectbox":68,"./components/volumecontrolbutton":69,"./components/volumeslider":70,"./components/volumetogglebutton":71,"./components/vrtogglebutton":72,"./components/watermark":73,"./demofactory":74,"./errorutils":76,"./playerutils":81,"./storageutils":82,"./stringutils":83,"./uifactory":86,"./uimanager":87,"./uiutils":88}],81:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var eventdispatcher_1 = require("./eventdispatcher");
var browserutils_1 = require("./browserutils");
var PlayerUtils;
(function (PlayerUtils) {
    var PlayerState;
    (function (PlayerState) {
        PlayerState[PlayerState["Idle"] = 0] = "Idle";
        PlayerState[PlayerState["Prepared"] = 1] = "Prepared";
        PlayerState[PlayerState["Playing"] = 2] = "Playing";
        PlayerState[PlayerState["Paused"] = 3] = "Paused";
        PlayerState[PlayerState["Finished"] = 4] = "Finished";
    })(PlayerState = PlayerUtils.PlayerState || (PlayerUtils.PlayerState = {}));
    function isTimeShiftAvailable(player) {
        return player.isLive() && player.getMaxTimeShift() !== 0;
    }
    PlayerUtils.isTimeShiftAvailable = isTimeShiftAvailable;
    function getState(player) {
        if (player.hasEnded()) {
            return PlayerState.Finished;
        }
        else if (player.isPlaying()) {
            return PlayerState.Playing;
        }
        else if (player.isPaused()) {
            return PlayerState.Paused;
        }
        else if (player.getSource() != null) {
            return PlayerState.Prepared;
        }
        else {
            return PlayerState.Idle;
        }
    }
    PlayerUtils.getState = getState;
    var TimeShiftAvailabilityDetector = /** @class */ (function () {
        function TimeShiftAvailabilityDetector(player) {
            var _this = this;
            this.timeShiftAvailabilityChangedEvent = new eventdispatcher_1.EventDispatcher();
            this.player = player;
            this.timeShiftAvailable = undefined;
            var timeShiftDetector = function () {
                _this.detect();
            };
            // Try to detect timeshift availability when source is loaded, which works for DASH streams
            player.on(player.exports.PlayerEvent.SourceLoaded, timeShiftDetector);
            // With HLS/NativePlayer streams, getMaxTimeShift can be 0 before the buffer fills, so we need to additionally
            // check timeshift availability in TimeChanged
            player.on(player.exports.PlayerEvent.TimeChanged, timeShiftDetector);
        }
        TimeShiftAvailabilityDetector.prototype.detect = function () {
            if (this.player.isLive()) {
                var timeShiftAvailableNow = PlayerUtils.isTimeShiftAvailable(this.player);
                // When the availability changes, we fire the event
                if (timeShiftAvailableNow !== this.timeShiftAvailable) {
                    this.timeShiftAvailabilityChangedEvent.dispatch(this.player, { timeShiftAvailable: timeShiftAvailableNow });
                    this.timeShiftAvailable = timeShiftAvailableNow;
                }
            }
        };
        Object.defineProperty(TimeShiftAvailabilityDetector.prototype, "onTimeShiftAvailabilityChanged", {
            get: function () {
                return this.timeShiftAvailabilityChangedEvent.getEvent();
            },
            enumerable: true,
            configurable: true
        });
        return TimeShiftAvailabilityDetector;
    }());
    PlayerUtils.TimeShiftAvailabilityDetector = TimeShiftAvailabilityDetector;
    /**
     * Detects changes of the stream type, i.e. changes of the return value of the player#isLive method.
     * Normally, a stream cannot change its type during playback, it's either VOD or live. Due to bugs on some
     * platforms or browsers, it can still change. It is therefore unreliable to just check #isLive and this detector
     * should be used as a workaround instead.
     *
     * Known cases:
     *
     * - HLS VOD on Android 4.3
     * Video duration is initially 'Infinity' and only gets available after playback starts, so streams are wrongly
     * reported as 'live' before playback (the live-check in the player checks for infinite duration).
     */
    var LiveStreamDetector = /** @class */ (function () {
        function LiveStreamDetector(player, uimanager) {
            var _this = this;
            this.liveChangedEvent = new eventdispatcher_1.EventDispatcher();
            this.player = player;
            this.uimanager = uimanager;
            this.live = undefined;
            var liveDetector = function () {
                _this.detect();
            };
            this.uimanager.getConfig().events.onUpdated.subscribe(liveDetector);
            // Re-evaluate when playback starts
            player.on(player.exports.PlayerEvent.Play, liveDetector);
            // HLS live detection workaround for Android:
            // Also re-evaluate during playback, because that is when the live flag might change.
            // (Doing it only in Android Chrome saves unnecessary overhead on other plattforms)
            if (browserutils_1.BrowserUtils.isAndroid && browserutils_1.BrowserUtils.isChrome) {
                player.on(player.exports.PlayerEvent.TimeChanged, liveDetector);
            }
        }
        LiveStreamDetector.prototype.detect = function () {
            var liveNow = this.player.isLive();
            // Compare current to previous live state flag and fire event when it changes. Since we initialize the flag
            // with undefined, there is always at least an initial event fired that tells listeners the live state.
            if (liveNow !== this.live) {
                this.liveChangedEvent.dispatch(this.player, { live: liveNow });
                this.live = liveNow;
            }
        };
        Object.defineProperty(LiveStreamDetector.prototype, "onLiveChanged", {
            get: function () {
                return this.liveChangedEvent.getEvent();
            },
            enumerable: true,
            configurable: true
        });
        return LiveStreamDetector;
    }());
    PlayerUtils.LiveStreamDetector = LiveStreamDetector;
})(PlayerUtils = exports.PlayerUtils || (exports.PlayerUtils = {}));
},{"./browserutils":3,"./eventdispatcher":77}],82:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StorageUtils;
(function (StorageUtils) {
    var hasLocalStorageCache;
    function hasLocalStorage() {
        if (hasLocalStorageCache) {
            return hasLocalStorageCache;
        }
        // hasLocalStorage is used to safely ensure we can use localStorage
        // taken from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Feature-detecting_localStorage
        var storage = { length: 0 };
        try {
            storage = window['localStorage'];
            var x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            hasLocalStorageCache = true;
        }
        catch (e) {
            hasLocalStorageCache = e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage.length !== 0;
        }
        return hasLocalStorageCache;
    }
    StorageUtils.hasLocalStorage = hasLocalStorage;
    /**
     * Stores a string item into localStorage.
     * @param key the item's key
     * @param data the item's data
     */
    function setItem(key, data) {
        if (StorageUtils.hasLocalStorage()) {
            window.localStorage.setItem(key, data);
        }
    }
    StorageUtils.setItem = setItem;
    /**
     * Gets an item's string value from the localStorage.
     * @param key the key to look up its associated value
     * @return {string | null} Returns the string if found, null if there is no data stored for the key
     */
    function getItem(key) {
        if (StorageUtils.hasLocalStorage()) {
            return window.localStorage.getItem(key);
        }
        else {
            return null;
        }
    }
    StorageUtils.getItem = getItem;
    /**
     * Stores an object into localStorage. The object will be serialized to JSON. The following types are supported
     * in addition to the default types:
     *  - ColorUtils.Color
     *
     * @param key the key to store the data to
     * @param data the object to store
     */
    function setObject(key, data) {
        if (StorageUtils.hasLocalStorage()) {
            var json = JSON.stringify(data);
            setItem(key, json);
        }
    }
    StorageUtils.setObject = setObject;
    /**
     * Gets an object for the given key from localStorage. The object will be deserialized from JSON. Beside the
     * default types, the following types are supported:
     *  - ColorUtils.Color
     *
     * @param key the key to look up its associated object
     * @return {any} Returns the object if found, null otherwise
     */
    function getObject(key) {
        if (StorageUtils.hasLocalStorage()) {
            var json = getItem(key);
            if (key) {
                var object = JSON.parse(json);
                return object;
            }
        }
        return null;
    }
    StorageUtils.getObject = getObject;
})(StorageUtils = exports.StorageUtils || (exports.StorageUtils = {}));
},{}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StringUtils;
(function (StringUtils) {
    StringUtils.FORMAT_HHMMSS = 'hh:mm:ss';
    StringUtils.FORMAT_MMSS = 'mm:ss';
    /**
     * Formats a number of seconds into a time string with the pattern hh:mm:ss.
     *
     * @param totalSeconds the total number of seconds to format to string
     * @param format the time format to output (default: hh:mm:ss)
     * @returns {string} the formatted time string
     */
    function secondsToTime(totalSeconds, format) {
        if (format === void 0) { format = StringUtils.FORMAT_HHMMSS; }
        var isNegative = totalSeconds < 0;
        if (isNegative) {
            // If the time is negative, we make it positive for the calculation below
            // (else we'd get all negative numbers) and reattach the negative sign later.
            totalSeconds = -totalSeconds;
        }
        // Split into separate time parts
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor(totalSeconds / 60) - hours * 60;
        var seconds = Math.floor(totalSeconds) % 60;
        return (isNegative ? '-' : '') + format
            .replace('hh', leftPadWithZeros(hours, 2))
            .replace('mm', leftPadWithZeros(minutes, 2))
            .replace('ss', leftPadWithZeros(seconds, 2));
    }
    StringUtils.secondsToTime = secondsToTime;
    /**
     * Converts a number to a string and left-pads it with zeros to the specified length.
     * Example: leftPadWithZeros(123, 5) => '00123'
     *
     * @param num the number to convert to string and pad with zeros
     * @param length the desired length of the padded string
     * @returns {string} the padded number as string
     */
    function leftPadWithZeros(num, length) {
        var text = num + '';
        var padding = '0000000000'.substr(0, length - text.length);
        return padding + text;
    }
    /**
     * Fills out placeholders in an ad message.
     *
     * Has the placeholders '{remainingTime[formatString]}', '{playedTime[formatString]}' and
     * '{adDuration[formatString]}', which are replaced by the remaining time until the ad can be skipped, the current
     * time or the ad duration. The format string is optional. If not specified, the placeholder is replaced by the time
     * in seconds. If specified, it must be of the following format:
     * - %d - Inserts the time as an integer.
     * - %0Nd - Inserts the time as an integer with leading zeroes, if the length of the time string is smaller than N.
     * - %f - Inserts the time as a float.
     * - %0Nf - Inserts the time as a float with leading zeroes.
     * - %.Mf - Inserts the time as a float with M decimal places. Can be combined with %0Nf, e.g. %04.2f (the time
     * 10.123
     * would be printed as 0010.12).
     * - %hh:mm:ss
     * - %mm:ss
     *
     * @param adMessage an ad message with optional placeholders to fill
     * @param skipOffset if specified, {remainingTime} will be filled with the remaining time until the ad can be skipped
     * @param player the player to get the time data from
     * @returns {string} the ad message with filled placeholders
     */
    function replaceAdMessagePlaceholders(adMessage, skipOffset, player) {
        var adMessagePlaceholderRegex = new RegExp('\\{(remainingTime|playedTime|adDuration)(}|%((0[1-9]\\d*(\\.\\d+(d|f)|d|f)|\\.\\d+f|d|f)|hh:mm:ss|mm:ss)})', 'g');
        return adMessage.replace(adMessagePlaceholderRegex, function (formatString) {
            var time = 0;
            if (formatString.indexOf('remainingTime') > -1) {
                if (skipOffset) {
                    time = Math.ceil(skipOffset - player.getCurrentTime());
                }
                else {
                    time = player.getDuration() - player.getCurrentTime();
                }
            }
            else if (formatString.indexOf('playedTime') > -1) {
                time = player.getCurrentTime();
            }
            else if (formatString.indexOf('adDuration') > -1) {
                time = player.getDuration();
            }
            return formatNumber(time, formatString);
        });
    }
    StringUtils.replaceAdMessagePlaceholders = replaceAdMessagePlaceholders;
    function formatNumber(time, format) {
        var formatStringValidationRegex = /%((0[1-9]\d*(\.\d+(d|f)|d|f)|\.\d+f|d|f)|hh:mm:ss|mm:ss)/;
        var leadingZeroesRegex = /(%0[1-9]\d*)(?=(\.\d+f|f|d))/;
        var decimalPlacesRegex = /\.\d*(?=f)/;
        if (!formatStringValidationRegex.test(format)) {
            // If the format is invalid, we set a default fallback format
            format = '%d';
        }
        // Determine the number of leading zeros
        var leadingZeroes = 0;
        var leadingZeroesMatches = format.match(leadingZeroesRegex);
        if (leadingZeroesMatches) {
            leadingZeroes = parseInt(leadingZeroesMatches[0].substring(2));
        }
        // Determine the number of decimal places
        var numDecimalPlaces = null;
        var decimalPlacesMatches = format.match(decimalPlacesRegex);
        if (decimalPlacesMatches && !isNaN(parseInt(decimalPlacesMatches[0].substring(1)))) {
            numDecimalPlaces = parseInt(decimalPlacesMatches[0].substring(1));
            if (numDecimalPlaces > 20) {
                numDecimalPlaces = 20;
            }
        }
        // Float format
        if (format.indexOf('f') > -1) {
            var timeString = '';
            if (numDecimalPlaces !== null) {
                // Apply fixed number of decimal places
                timeString = time.toFixed(numDecimalPlaces);
            }
            else {
                timeString = '' + time;
            }
            // Apply leading zeros
            if (timeString.indexOf('.') > -1) {
                return leftPadWithZeros(timeString, timeString.length + (leadingZeroes - timeString.indexOf('.')));
            }
            else {
                return leftPadWithZeros(timeString, leadingZeroes);
            }
        }
        // Time format
        else if (format.indexOf(':') > -1) {
            var totalSeconds = Math.ceil(time);
            // hh:mm:ss format
            if (format.indexOf('hh') > -1) {
                return secondsToTime(totalSeconds);
            }
            // mm:ss format
            else {
                var minutes = Math.floor(totalSeconds / 60);
                var seconds = totalSeconds % 60;
                return leftPadWithZeros(minutes, 2) + ':' + leftPadWithZeros(seconds, 2);
            }
        }
        // Integer format
        else {
            return leftPadWithZeros(Math.ceil(time), leadingZeroes);
        }
    }
})(StringUtils = exports.StringUtils || (exports.StringUtils = {}));
},{}],84:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helper class to handle all subtitle related events
 *
 * This class listens to player events as well as the `ListSelector` event if selection changed
 */
var SubtitleSwitchHandler = /** @class */ (function () {
    function SubtitleSwitchHandler(player, element, uimanager) {
        this.player = player;
        this.listElement = element;
        this.uimanager = uimanager;
        this.bindSelectionEvent();
        this.bindPlayerEvents();
        this.updateSubtitles();
    }
    SubtitleSwitchHandler.prototype.bindSelectionEvent = function () {
        var _this = this;
        this.listElement.onItemSelected.subscribe(function (_, value) {
            // TODO add support for multiple concurrent subtitle selections
            if (value === 'null') {
                var currentSubtitle = _this.player.subtitles.list().filter(function (subtitle) { return subtitle.enabled; }).pop();
                _this.player.subtitles.disable(currentSubtitle.id);
            }
            else {
                _this.player.subtitles.enable(value, true);
            }
        });
    };
    SubtitleSwitchHandler.prototype.bindPlayerEvents = function () {
        var _this = this;
        var updateSubtitlesCallback = function () { return _this.updateSubtitles(); };
        this.player.on(this.player.exports.PlayerEvent.SubtitleAdded, updateSubtitlesCallback);
        this.player.on(this.player.exports.PlayerEvent.SubtitleEnabled, function () {
            _this.selectCurrentSubtitle();
        });
        this.player.on(this.player.exports.PlayerEvent.SubtitleDisabled, function () {
            _this.selectCurrentSubtitle();
        });
        this.player.on(this.player.exports.PlayerEvent.SubtitleRemoved, updateSubtitlesCallback);
        // Update subtitles when source goes away
        this.player.on(this.player.exports.PlayerEvent.SourceUnloaded, updateSubtitlesCallback);
        // Update subtitles when the period within a source changes
        this.player.on(this.player.exports.PlayerEvent.PeriodSwitched, updateSubtitlesCallback);
        this.uimanager.getConfig().events.onUpdated.subscribe(updateSubtitlesCallback);
    };
    SubtitleSwitchHandler.prototype.updateSubtitles = function () {
        this.listElement.clearItems();
        if (!this.player.subtitles) {
            // Subtitles API not available (yet)
            return;
        }
        this.listElement.addItem('null', 'off');
        for (var _i = 0, _a = this.player.subtitles.list(); _i < _a.length; _i++) {
            var subtitle = _a[_i];
            this.listElement.addItem(subtitle.id, subtitle.label);
        }
        // Select the correct subtitle after the subtitles have been added
        this.selectCurrentSubtitle();
    };
    SubtitleSwitchHandler.prototype.selectCurrentSubtitle = function () {
        var currentSubtitle = this.player.subtitles.list().filter(function (subtitle) { return subtitle.enabled; }).pop();
        if (currentSubtitle) {
            this.listElement.selectItem(currentSubtitle.id);
        }
    };
    return SubtitleSwitchHandler;
}());
exports.SubtitleSwitchHandler = SubtitleSwitchHandler;
},{}],85:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO change to internal (not exported) class, how to use in other files?
/**
 * Executes a callback after a specified amount of time, optionally repeatedly until stopped.
 */
var Timeout = /** @class */ (function () {
    /**
     * Creates a new timeout callback handler.
     * @param delay the delay in milliseconds after which the callback should be executed
     * @param callback the callback to execute after the delay time
     * @param repeat if true, call the callback repeatedly in delay intervals
     */
    function Timeout(delay, callback, repeat) {
        if (repeat === void 0) { repeat = false; }
        this.delay = delay;
        this.callback = callback;
        this.repeat = repeat;
        this.timeoutOrIntervalId = 0;
        this.active = false;
    }
    /**
     * Starts the timeout and calls the callback when the timeout delay has passed.
     * @returns {Timeout} the current timeout (so the start call can be chained to the constructor)
     */
    Timeout.prototype.start = function () {
        this.reset();
        return this;
    };
    /**
     * Clears the timeout. The callback will not be called if clear is called during the timeout.
     */
    Timeout.prototype.clear = function () {
        this.clearInternal();
    };
    /**
     * Resets the passed timeout delay to zero. Can be used to defer the calling of the callback.
     */
    Timeout.prototype.reset = function () {
        var _this = this;
        this.clearInternal();
        if (this.repeat) {
            this.timeoutOrIntervalId = setInterval(this.callback, this.delay);
        }
        else {
            this.timeoutOrIntervalId = setTimeout(function () {
                _this.active = false;
                _this.callback();
            }, this.delay);
        }
        this.active = true;
    };
    Timeout.prototype.isActive = function () {
        return this.active;
    };
    Timeout.prototype.clearInternal = function () {
        if (this.repeat) {
            clearInterval(this.timeoutOrIntervalId);
        }
        else {
            clearTimeout(this.timeoutOrIntervalId);
        }
        this.active = false;
    };
    return Timeout;
}());
exports.Timeout = Timeout;
},{}],86:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var subtitleoverlay_1 = require("./components/subtitleoverlay");
var settingspanelpage_1 = require("./components/settingspanelpage");
var settingspanelitem_1 = require("./components/settingspanelitem");
var videoqualityselectbox_1 = require("./components/videoqualityselectbox");
var playbackspeedselectbox_1 = require("./components/playbackspeedselectbox");
var audiotrackselectbox_1 = require("./components/audiotrackselectbox");
var audioqualityselectbox_1 = require("./components/audioqualityselectbox");
var settingspanel_1 = require("./components/settingspanel");
var subtitlesettingspanelpage_1 = require("./components/subtitlesettings/subtitlesettingspanelpage");
var settingspanelpageopenbutton_1 = require("./components/settingspanelpageopenbutton");
var subtitlesettingslabel_1 = require("./components/subtitlesettings/subtitlesettingslabel");
var subtitleselectbox_1 = require("./components/subtitleselectbox");
var controlbar_1 = require("./components/controlbar");
var container_1 = require("./components/container");
var playbacktimelabel_1 = require("./components/playbacktimelabel");
var seekbar_1 = require("./components/seekbar");
var seekbarlabel_1 = require("./components/seekbarlabel");
var playbacktogglebutton_1 = require("./components/playbacktogglebutton");
var volumetogglebutton_1 = require("./components/volumetogglebutton");
var volumeslider_1 = require("./components/volumeslider");
var spacer_1 = require("./components/spacer");
var pictureinpicturetogglebutton_1 = require("./components/pictureinpicturetogglebutton");
var airplaytogglebutton_1 = require("./components/airplaytogglebutton");
var casttogglebutton_1 = require("./components/casttogglebutton");
var vrtogglebutton_1 = require("./components/vrtogglebutton");
var settingstogglebutton_1 = require("./components/settingstogglebutton");
var fullscreentogglebutton_1 = require("./components/fullscreentogglebutton");
var uicontainer_1 = require("./components/uicontainer");
var bufferingoverlay_1 = require("./components/bufferingoverlay");
var playbacktoggleoverlay_1 = require("./components/playbacktoggleoverlay");
var caststatusoverlay_1 = require("./components/caststatusoverlay");
var titlebar_1 = require("./components/titlebar");
var recommendationoverlay_1 = require("./components/recommendationoverlay");
var watermark_1 = require("./components/watermark");
var errormessageoverlay_1 = require("./components/errormessageoverlay");
var adclickoverlay_1 = require("./components/adclickoverlay");
var admessagelabel_1 = require("./components/admessagelabel");
var adskipbutton_1 = require("./components/adskipbutton");
var closebutton_1 = require("./components/closebutton");
var metadatalabel_1 = require("./components/metadatalabel");
var playerutils_1 = require("./playerutils");
var label_1 = require("./components/label");
var castuicontainer_1 = require("./components/castuicontainer");
var uimanager_1 = require("./uimanager");
var UIFactory;
(function (UIFactory) {
    function buildDefaultUI(player, config) {
        if (config === void 0) { config = {}; }
        return UIFactory.buildModernUI(player, config);
    }
    UIFactory.buildDefaultUI = buildDefaultUI;
    function buildDefaultSmallScreenUI(player, config) {
        if (config === void 0) { config = {}; }
        return UIFactory.buildModernSmallScreenUI(player, config);
    }
    UIFactory.buildDefaultSmallScreenUI = buildDefaultSmallScreenUI;
    function buildDefaultCastReceiverUI(player, config) {
        if (config === void 0) { config = {}; }
        return UIFactory.buildModernCastReceiverUI(player, config);
    }
    UIFactory.buildDefaultCastReceiverUI = buildDefaultCastReceiverUI;
    function modernUI() {
        var subtitleOverlay = new subtitleoverlay_1.SubtitleOverlay();
        var mainSettingsPanelPage = new settingspanelpage_1.SettingsPanelPage({
            components: [
                new settingspanelitem_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                new settingspanelitem_1.SettingsPanelItem('Speed', new playbackspeedselectbox_1.PlaybackSpeedSelectBox()),
                new settingspanelitem_1.SettingsPanelItem('Audio Track', new audiotrackselectbox_1.AudioTrackSelectBox()),
                new settingspanelitem_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
            ],
        });
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                mainSettingsPanelPage,
            ],
            hidden: true,
        });
        var subtitleSettingsPanelPage = new subtitlesettingspanelpage_1.SubtitleSettingsPanelPage({
            settingsPanel: settingsPanel,
            overlay: subtitleOverlay,
        });
        var subtitleSettingsOpenButton = new settingspanelpageopenbutton_1.SettingsPanelPageOpenButton({
            targetPage: subtitleSettingsPanelPage,
            container: settingsPanel,
            text: 'open',
        });
        mainSettingsPanelPage.addComponent(new settingspanelitem_1.SettingsPanelItem(new subtitlesettingslabel_1.SubtitleSettingsLabel({ text: 'Subtitles', opener: subtitleSettingsOpenButton }), new subtitleselectbox_1.SubtitleSelectBox()));
        settingsPanel.addComponent(subtitleSettingsPanelPage);
        var controlBar = new controlbar_1.ControlBar({
            components: [
                settingsPanel,
                new container_1.Container({
                    components: [
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.CurrentTime, hideInLivePlayback: true }),
                        new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
                    ],
                    cssClasses: ['controlbar-top'],
                }),
                new container_1.Container({
                    components: [
                        new playbacktogglebutton_1.PlaybackToggleButton(),
                        new volumetogglebutton_1.VolumeToggleButton(),
                        new volumeslider_1.VolumeSlider(),
                        new spacer_1.Spacer(),
                        new pictureinpicturetogglebutton_1.PictureInPictureToggleButton(),
                        new airplaytogglebutton_1.AirPlayToggleButton(),
                        new casttogglebutton_1.CastToggleButton(),
                        new vrtogglebutton_1.VRToggleButton(),
                        new settingstogglebutton_1.SettingsToggleButton({ settingsPanel: settingsPanel }),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ],
                    cssClasses: ['controlbar-bottom'],
                }),
            ],
        });
        return new uicontainer_1.UIContainer({
            components: [
                subtitleOverlay,
                new bufferingoverlay_1.BufferingOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                controlBar,
                new titlebar_1.TitleBar(),
                new recommendationoverlay_1.RecommendationOverlay(),
                new watermark_1.Watermark(),
                new errormessageoverlay_1.ErrorMessageOverlay(),
            ],
        });
    }
    function modernAdsUI() {
        return new uicontainer_1.UIContainer({
            components: [
                new bufferingoverlay_1.BufferingOverlay(),
                new adclickoverlay_1.AdClickOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new container_1.Container({
                    components: [
                        new admessagelabel_1.AdMessageLabel({ text: 'Ad: {remainingTime} secs' }),
                        new adskipbutton_1.AdSkipButton(),
                    ],
                    cssClass: 'ui-ads-status',
                }),
                new controlbar_1.ControlBar({
                    components: [
                        new container_1.Container({
                            components: [
                                new playbacktogglebutton_1.PlaybackToggleButton(),
                                new volumetogglebutton_1.VolumeToggleButton(),
                                new volumeslider_1.VolumeSlider(),
                                new spacer_1.Spacer(),
                                new fullscreentogglebutton_1.FullscreenToggleButton(),
                            ],
                            cssClasses: ['controlbar-bottom'],
                        }),
                    ],
                }),
            ],
            cssClasses: ['ui-skin-ads'],
        });
    }
    UIFactory.modernAdsUI = modernAdsUI;
    function modernSmallScreenUI() {
        var subtitleOverlay = new subtitleoverlay_1.SubtitleOverlay();
        var mainSettingsPanelPage = new settingspanelpage_1.SettingsPanelPage({
            components: [
                new settingspanelitem_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                new settingspanelitem_1.SettingsPanelItem('Speed', new playbackspeedselectbox_1.PlaybackSpeedSelectBox()),
                new settingspanelitem_1.SettingsPanelItem('Audio Track', new audiotrackselectbox_1.AudioTrackSelectBox()),
                new settingspanelitem_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
            ],
        });
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                mainSettingsPanelPage,
            ],
            hidden: true,
            pageTransitionAnimation: false,
        });
        var subtitleSettingsPanelPage = new subtitlesettingspanelpage_1.SubtitleSettingsPanelPage({
            settingsPanel: settingsPanel,
            overlay: subtitleOverlay,
        });
        var subtitleSettingsOpenButton = new settingspanelpageopenbutton_1.SettingsPanelPageOpenButton({
            targetPage: subtitleSettingsPanelPage,
            container: settingsPanel,
            text: 'open',
        });
        mainSettingsPanelPage.addComponent(new settingspanelitem_1.SettingsPanelItem(new subtitlesettingslabel_1.SubtitleSettingsLabel({ text: 'Subtitles', opener: subtitleSettingsOpenButton }), new subtitleselectbox_1.SubtitleSelectBox()));
        settingsPanel.addComponent(subtitleSettingsPanelPage);
        settingsPanel.addComponent(new closebutton_1.CloseButton({ target: settingsPanel }));
        subtitleSettingsPanelPage.addComponent(new closebutton_1.CloseButton({ target: settingsPanel }));
        var controlBar = new controlbar_1.ControlBar({
            components: [
                new container_1.Container({
                    components: [
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.CurrentTime, hideInLivePlayback: true }),
                        new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
                    ],
                    cssClasses: ['controlbar-top'],
                }),
            ],
        });
        return new uicontainer_1.UIContainer({
            components: [
                subtitleOverlay,
                new bufferingoverlay_1.BufferingOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new recommendationoverlay_1.RecommendationOverlay(),
                controlBar,
                new titlebar_1.TitleBar({
                    components: [
                        new metadatalabel_1.MetadataLabel({ content: metadatalabel_1.MetadataLabelContent.Title }),
                        new casttogglebutton_1.CastToggleButton(),
                        new vrtogglebutton_1.VRToggleButton(),
                        new pictureinpicturetogglebutton_1.PictureInPictureToggleButton(),
                        new airplaytogglebutton_1.AirPlayToggleButton(),
                        new volumetogglebutton_1.VolumeToggleButton(),
                        new settingstogglebutton_1.SettingsToggleButton({ settingsPanel: settingsPanel }),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ],
                }),
                settingsPanel,
                new watermark_1.Watermark(),
                new errormessageoverlay_1.ErrorMessageOverlay(),
            ],
            cssClasses: ['ui-skin-smallscreen'],
            hidePlayerStateExceptions: [playerutils_1.PlayerUtils.PlayerState.Finished],
        });
    }
    UIFactory.modernSmallScreenUI = modernSmallScreenUI;
    function modernSmallScreenAdsUI() {
        return new uicontainer_1.UIContainer({
            components: [
                new bufferingoverlay_1.BufferingOverlay(),
                new adclickoverlay_1.AdClickOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new titlebar_1.TitleBar({
                    components: [
                        // dummy label with no content to move buttons to the right
                        new label_1.Label({ cssClass: 'label-metadata-title' }),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ],
                }),
                new container_1.Container({
                    components: [
                        new admessagelabel_1.AdMessageLabel({ text: 'Ad: {remainingTime} secs' }),
                        new adskipbutton_1.AdSkipButton(),
                    ],
                    cssClass: 'ui-ads-status',
                }),
            ],
            cssClasses: ['ui-skin-ads', 'ui-skin-smallscreen'],
        });
    }
    UIFactory.modernSmallScreenAdsUI = modernSmallScreenAdsUI;
    function modernCastReceiverUI() {
        var controlBar = new controlbar_1.ControlBar({
            components: [
                new container_1.Container({
                    components: [
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.CurrentTime, hideInLivePlayback: true }),
                        new seekbar_1.SeekBar({ smoothPlaybackPositionUpdateIntervalMs: -1 }),
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.PlaybackTimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
                    ],
                    cssClasses: ['controlbar-top'],
                }),
            ],
        });
        return new castuicontainer_1.CastUIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new bufferingoverlay_1.BufferingOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new watermark_1.Watermark(),
                controlBar,
                new titlebar_1.TitleBar({ keepHiddenWithoutMetadata: true }),
                new errormessageoverlay_1.ErrorMessageOverlay(),
            ],
            cssClasses: ['ui-skin-cast-receiver'],
        });
    }
    UIFactory.modernCastReceiverUI = modernCastReceiverUI;
    function buildModernUI(player, config) {
        if (config === void 0) { config = {}; }
        // show smallScreen UI only on mobile/handheld devices
        var smallScreenSwitchWidth = 600;
        return new uimanager_1.UIManager(player, [{
                ui: modernSmallScreenAdsUI(),
                condition: function (context) {
                    return context.isMobile && context.documentWidth < smallScreenSwitchWidth && context.isAd
                        && context.adRequiresUi;
                },
            }, {
                ui: modernAdsUI(),
                condition: function (context) {
                    return context.isAd && context.adRequiresUi;
                },
            }, {
                ui: modernSmallScreenUI(),
                condition: function (context) {
                    return !context.isAd && !context.adRequiresUi && context.isMobile
                        && context.documentWidth < smallScreenSwitchWidth;
                },
            }, {
                ui: modernUI(),
                condition: function (context) {
                    return !context.isAd && !context.adRequiresUi;
                },
            }], config);
    }
    UIFactory.buildModernUI = buildModernUI;
    function buildModernSmallScreenUI(player, config) {
        if (config === void 0) { config = {}; }
        return new uimanager_1.UIManager(player, [{
                ui: modernSmallScreenAdsUI(),
                condition: function (context) {
                    return context.isAd && context.adRequiresUi;
                },
            }, {
                ui: modernSmallScreenUI(),
                condition: function (context) {
                    return !context.isAd && !context.adRequiresUi;
                },
            }], config);
    }
    UIFactory.buildModernSmallScreenUI = buildModernSmallScreenUI;
    function buildModernCastReceiverUI(player, config) {
        if (config === void 0) { config = {}; }
        return new uimanager_1.UIManager(player, modernCastReceiverUI(), config);
    }
    UIFactory.buildModernCastReceiverUI = buildModernCastReceiverUI;
})(UIFactory = exports.UIFactory || (exports.UIFactory = {}));
},{"./components/adclickoverlay":4,"./components/admessagelabel":5,"./components/adskipbutton":6,"./components/airplaytogglebutton":7,"./components/audioqualityselectbox":8,"./components/audiotrackselectbox":10,"./components/bufferingoverlay":11,"./components/caststatusoverlay":13,"./components/casttogglebutton":14,"./components/castuicontainer":15,"./components/closebutton":17,"./components/container":19,"./components/controlbar":20,"./components/errormessageoverlay":21,"./components/fullscreentogglebutton":22,"./components/label":26,"./components/metadatalabel":29,"./components/pictureinpicturetogglebutton":30,"./components/playbackspeedselectbox":31,"./components/playbacktimelabel":32,"./components/playbacktogglebutton":33,"./components/playbacktoggleoverlay":34,"./components/recommendationoverlay":35,"./components/seekbar":36,"./components/seekbarlabel":37,"./components/settingspanel":39,"./components/settingspanelitem":40,"./components/settingspanelpage":41,"./components/settingspanelpageopenbutton":44,"./components/settingstogglebutton":45,"./components/spacer":46,"./components/subtitleoverlay":48,"./components/subtitleselectbox":49,"./components/subtitlesettings/subtitlesettingslabel":58,"./components/subtitlesettings/subtitlesettingspanelpage":60,"./components/titlebar":64,"./components/uicontainer":67,"./components/videoqualityselectbox":68,"./components/volumeslider":70,"./components/volumetogglebutton":71,"./components/vrtogglebutton":72,"./components/watermark":73,"./playerutils":81,"./uimanager":87}],87:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var uicontainer_1 = require("./components/uicontainer");
var dom_1 = require("./dom");
var container_1 = require("./components/container");
var eventdispatcher_1 = require("./eventdispatcher");
var uiutils_1 = require("./uiutils");
var arrayutils_1 = require("./arrayutils");
var browserutils_1 = require("./browserutils");
var volumecontroller_1 = require("./volumecontroller");
var UIManager = /** @class */ (function () {
    function UIManager(player, playerUiOrUiVariants, uiconfig) {
        if (uiconfig === void 0) { uiconfig = {}; }
        var _this = this;
        this.events = {
            onUiVariantResolve: new eventdispatcher_1.EventDispatcher(),
        };
        if (playerUiOrUiVariants instanceof uicontainer_1.UIContainer) {
            // Single-UI constructor has been called, transform arguments to UIVariant[] signature
            var playerUi = playerUiOrUiVariants;
            var uiVariants = [];
            // Add the default player UI
            uiVariants.push({ ui: playerUi });
            this.uiVariants = uiVariants;
        }
        else {
            // Default constructor (UIVariant[]) has been called
            this.uiVariants = playerUiOrUiVariants;
        }
        this.player = player;
        this.managerPlayerWrapper = new PlayerWrapper(player);
        // ensure that at least the metadata object does exist in the uiconfig
        uiconfig.metadata = uiconfig.metadata ? uiconfig.metadata : {};
        this.config = __assign({ playbackSpeedSelectionEnabled: true, autoUiVariantResolve: true }, uiconfig, { events: {
                onUpdated: new eventdispatcher_1.EventDispatcher(),
            }, volumeController: new volumecontroller_1.VolumeController(this.managerPlayerWrapper.getPlayer()) });
        /**
         * Gathers configuration data from the UI config and player source config and creates a merged UI config
         * that is used throughout the UI instance.
         */
        var updateConfig = function () {
            var playerSourceConfig = player.getSource() || {};
            _this.config.metadata = JSON.parse(JSON.stringify(uiconfig.metadata || {}));
            // Extract the UI-related config properties from the source config
            var playerSourceUiConfig = {
                metadata: {
                    // TODO move metadata into source.metadata namespace in player v8
                    title: playerSourceConfig.title,
                    description: playerSourceConfig.description,
                    markers: playerSourceConfig.markers,
                },
                recommendations: playerSourceConfig.recommendations,
            };
            // Player source config takes precedence over the UI config, because the config in the source is attached
            // to a source which changes with every player.load, whereas the UI config stays the same for the whole
            // lifetime of the player instance.
            _this.config.metadata.title = playerSourceUiConfig.metadata.title || uiconfig.metadata.title;
            _this.config.metadata.description = playerSourceUiConfig.metadata.description || uiconfig.metadata.description;
            _this.config.metadata.markers = playerSourceUiConfig.metadata.markers || uiconfig.metadata.markers || [];
            _this.config.recommendations = playerSourceUiConfig.recommendations || uiconfig.recommendations || [];
        };
        updateConfig();
        // Update the configuration when a new source is loaded
        this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.SourceLoaded, function () {
            updateConfig();
            _this.config.events.onUpdated.dispatch(_this);
        });
        if (uiconfig.container) {
            // Unfortunately "uiContainerElement = new DOM(config.container)" will not accept the container with
            // string|HTMLElement type directly, although it accepts both types, so we need to spit these two cases up here.
            // TODO check in upcoming TS versions if the container can be passed in directly, or fix the constructor
            this.uiContainerElement = uiconfig.container instanceof HTMLElement ?
                new dom_1.DOM(uiconfig.container) : new dom_1.DOM(uiconfig.container);
        }
        else {
            this.uiContainerElement = new dom_1.DOM(player.getContainer());
        }
        // Create UI instance managers for the UI variants
        // The instance managers map to the corresponding UI variants by their array index
        this.uiInstanceManagers = [];
        var uiVariantsWithoutCondition = [];
        for (var _i = 0, _a = this.uiVariants; _i < _a.length; _i++) {
            var uiVariant = _a[_i];
            if (uiVariant.condition == null) {
                // Collect variants without conditions for error checking
                uiVariantsWithoutCondition.push(uiVariant);
            }
            // Create the instance manager for a UI variant
            this.uiInstanceManagers.push(new InternalUIInstanceManager(player, uiVariant.ui, this.config));
        }
        // Make sure that there is only one UI variant without a condition
        // It does not make sense to have multiple variants without condition, because only the first one in the list
        // (the one with the lowest index) will ever be selected.
        if (uiVariantsWithoutCondition.length > 1) {
            throw Error('Too many UIs without a condition: You cannot have more than one default UI');
        }
        // Make sure that the default UI variant, if defined, is at the end of the list (last index)
        // If it comes earlier, the variants with conditions that come afterwards will never be selected because the
        // default variant without a condition always evaluates to 'true'
        if (uiVariantsWithoutCondition.length > 0
            && uiVariantsWithoutCondition[0] !== this.uiVariants[this.uiVariants.length - 1]) {
            throw Error('Invalid UI variant order: the default UI (without condition) must be at the end of the list');
        }
        var adStartedEvent = null; // keep the event stored here during ad playback
        // Dynamically select a UI variant that matches the current UI condition.
        var resolveUiVariant = function (event) {
            // Make sure that the AdStarted event data is persisted through ad playback in case other events happen
            // in the meantime, e.g. player resize. We need to store this data because there is no other way to find out
            // ad details while an ad is playing (in v8.0 at least; from v8.1 there will be ads.getActiveAd()).
            // Existing event data signals that an ad is currently active (instead of ads.isLinearAdActive()).
            if (event != null) {
                switch (event.type) {
                    // The ads UI is shown upon the first AdStarted event. Subsequent AdStarted events within an ad break
                    // will not change the condition context and thus not lead to undesired UI variant resolving.
                    // The ads UI is shown upon AdStarted instead of AdBreakStarted because there can be a loading delay
                    // between these two events in the player, and the AdBreakStarted event does not carry any metadata to
                    // initialize the ads UI, so it would be rendered in an uninitialized state for a certain amount of time.
                    // TODO show ads UI upon AdBreakStarted and display loading overlay between AdBreakStarted and first AdStarted
                    // TODO display loading overlay between AdFinished and next AdStarted
                    case player.exports.PlayerEvent.AdStarted:
                        adStartedEvent = event;
                        break;
                    // The ads UI is hidden only when the ad break is finished, i.e. not on AdFinished events. This way we keep
                    // the ads UI variant active throughout an ad break, as reacting to AdFinished would lead to undesired UI
                    // variant switching between two ads in an ad break, e.g. ads UI -> AdFinished -> content UI ->
                    // AdStarted -> ads UI.
                    case player.exports.PlayerEvent.AdBreakFinished:
                        adStartedEvent = null;
                        // When switching to a variant for the first time, a config.events.onUpdated event is fired to trigger a UI
                        // update of the new variant, because most components subscribe to this event to update themselves. When
                        // switching to the ads UI on the first AdStarted, all UI variants update themselves with the ad data, so
                        // when switching back to the "normal" UI it will carry properties of the ad instead of the main content.
                        // We thus fire this event here to force an UI update with the properties of the main content. This is
                        // basically a hack because the config.events.onUpdated event is abused in many places and not just used
                        // for config updates (e.g. adding a marker to the seekbar).
                        // TODO introduce an event that is fired when the playback content is updated, a switch to/from ads
                        _this.config.events.onUpdated.dispatch(_this);
                        break;
                    // When a new source is loaded during ad playback, there will be no Ad(Break)Finished event
                    case player.exports.PlayerEvent.SourceLoaded:
                        adStartedEvent = null;
                        break;
                }
            }
            // Detect if an ad has started
            var isAd = adStartedEvent != null;
            var adRequiresUi = false;
            if (isAd) {
                var ad = adStartedEvent.ad;
                // for now only linear ads can request a UI
                if (ad.isLinear) {
                    var linearAd = ad;
                    adRequiresUi = linearAd.uiConfig && linearAd.uiConfig.requestsUi || false;
                }
            }
            _this.resolveUiVariant({
                isAd: isAd,
                adRequiresUi: adRequiresUi,
            }, function (context) {
                // If this is an ad UI, we need to relay the saved ON_AD_STARTED event data so ad components can configure
                // themselves for the current ad.
                if (context.isAd) {
                    /* Relay the ON_AD_STARTED event to the ads UI
                     *
                     * Because the ads UI is initialized in the ON_AD_STARTED handler, i.e. when the ON_AD_STARTED event has
                     * already been fired, components in the ads UI that listen for the ON_AD_STARTED event never receive it.
                     * Since this can break functionality of components that rely on this event, we relay the event to the
                     * ads UI components with the following call.
                     */
                    _this.currentUi.getWrappedPlayer().fireEventInUI(_this.player.exports.PlayerEvent.AdStarted, adStartedEvent);
                }
            });
        };
        // Listen to the following events to trigger UI variant resolution
        if (this.config.autoUiVariantResolve) {
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.SourceLoaded, resolveUiVariant);
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.Play, resolveUiVariant);
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.Paused, resolveUiVariant);
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.AdStarted, resolveUiVariant);
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.AdBreakFinished, resolveUiVariant);
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.PlayerResized, resolveUiVariant);
            this.managerPlayerWrapper.getPlayer().on(this.player.exports.PlayerEvent.ViewModeChanged, resolveUiVariant);
        }
        // Initialize the UI
        resolveUiVariant(null);
    }
    UIManager.prototype.getConfig = function () {
        return this.config;
    };
    /**
     * Returns the list of UI variants as passed into the constructor of {@link UIManager}.
     * @returns {UIVariant[]} the list of available UI variants
     */
    UIManager.prototype.getUiVariants = function () {
        return this.uiVariants;
    };
    /**
     * Switches to a UI variant from the list returned by {@link getUiVariants}.
     * @param {UIVariant} uiVariant the UI variant to switch to
     * @param {() => void} onShow a callback that is executed just before the new UI variant is shown
     */
    UIManager.prototype.switchToUiVariant = function (uiVariant, onShow) {
        var uiVariantIndex = this.uiVariants.indexOf(uiVariant);
        var nextUi = this.uiInstanceManagers[uiVariantIndex];
        var uiVariantChanged = false;
        // Determine if the UI variant is changing
        if (nextUi !== this.currentUi) {
            uiVariantChanged = true;
            // console.log('switched from ', this.currentUi ? this.currentUi.getUI() : 'none',
            //   ' to ', nextUi ? nextUi.getUI() : 'none');
        }
        // Only if the UI variant is changing, we need to do some stuff. Else we just leave everything as-is.
        if (uiVariantChanged) {
            // Hide the currently active UI variant
            if (this.currentUi) {
                this.currentUi.getUI().hide();
            }
            // Assign the new UI variant as current UI
            this.currentUi = nextUi;
            // When we switch to a different UI instance, there's some additional stuff to manage. If we do not switch
            // to an instance, we're done here.
            if (this.currentUi != null) {
                // Add the UI to the DOM (and configure it) the first time it is selected
                if (!this.currentUi.isConfigured()) {
                    this.addUi(this.currentUi);
                }
                if (onShow) {
                    onShow();
                }
                this.currentUi.getUI().show();
            }
        }
    };
    /**
     * Triggers a UI variant switch as triggered by events when automatic switching is enabled. It allows to overwrite
     * properties of the {@link UIConditionContext}.
     * @param {Partial<UIConditionContext>} context an optional set of properties that overwrite properties of the
     *   automatically determined context
     * @param {(context: UIConditionContext) => void} onShow a callback that is executed just before the new UI variant
     *   is shown (if a switch is happening)
     */
    UIManager.prototype.resolveUiVariant = function (context, onShow) {
        if (context === void 0) { context = {}; }
        // Determine the current context for which the UI variant will be resolved
        var defaultContext = {
            isAd: false,
            adRequiresUi: false,
            isFullscreen: this.player.getViewMode() === this.player.exports.ViewMode.Fullscreen,
            isMobile: browserutils_1.BrowserUtils.isMobile,
            isPlaying: this.player.isPlaying(),
            width: this.uiContainerElement.width(),
            documentWidth: document.body.clientWidth,
        };
        // Overwrite properties of the default context with passed in context properties
        var switchingContext = __assign({}, defaultContext, context);
        // Fire the event and allow modification of the context before it is used to resolve the UI variant
        this.events.onUiVariantResolve.dispatch(this, switchingContext);
        var nextUiVariant = null;
        // Select new UI variant
        // If no variant condition is fulfilled, we switch to *no* UI
        for (var _i = 0, _a = this.uiVariants; _i < _a.length; _i++) {
            var uiVariant = _a[_i];
            if (uiVariant.condition == null || uiVariant.condition(switchingContext) === true) {
                nextUiVariant = uiVariant;
                break;
            }
        }
        this.switchToUiVariant(nextUiVariant, function () {
            if (onShow) {
                onShow(switchingContext);
            }
        });
    };
    UIManager.prototype.addUi = function (ui) {
        var dom = ui.getUI().getDomElement();
        var player = ui.getWrappedPlayer();
        ui.configureControls();
        /* Append the UI DOM after configuration to avoid CSS transitions at initialization
         * Example: Components are hidden during configuration and these hides may trigger CSS transitions that are
         * undesirable at this time. */
        this.uiContainerElement.append(dom);
        // When the UI is loaded after a source was loaded, we need to tell the components to initialize themselves
        if (player.getSource()) {
            this.config.events.onUpdated.dispatch(this);
        }
        // Fire onConfigured after UI DOM elements are successfully added. When fired immediately, the DOM elements
        // might not be fully configured and e.g. do not have a size.
        // https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
        if (window.requestAnimationFrame) {
            requestAnimationFrame(function () { ui.onConfigured.dispatch(ui.getUI()); });
        }
        else {
            // IE9 fallback
            setTimeout(function () { ui.onConfigured.dispatch(ui.getUI()); }, 0);
        }
    };
    UIManager.prototype.releaseUi = function (ui) {
        ui.releaseControls();
        ui.getUI().getDomElement().remove();
        ui.clearEventHandlers();
    };
    UIManager.prototype.release = function () {
        for (var _i = 0, _a = this.uiInstanceManagers; _i < _a.length; _i++) {
            var uiInstanceManager = _a[_i];
            this.releaseUi(uiInstanceManager);
        }
        this.managerPlayerWrapper.clearEventHandlers();
    };
    Object.defineProperty(UIManager.prototype, "onUiVariantResolve", {
        /**
         * Fires just before UI variants are about to be resolved and the UI variant is possibly switched. It is fired when
         * the switch is triggered from an automatic switch and when calling {@link resolveUiVariant}.
         * Can be used to modify the {@link UIConditionContext} before resolving is done.
         * @returns {EventDispatcher<UIManager, UIConditionContext>}
         */
        get: function () {
            return this.events.onUiVariantResolve;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the list of all added markers in undefined order.
     */
    UIManager.prototype.getTimelineMarkers = function () {
        return this.config.metadata.markers;
    };
    /**
     * Adds a marker to the timeline. Does not check for duplicates/overlaps at the `time`.
     */
    UIManager.prototype.addTimelineMarker = function (timelineMarker) {
        this.config.metadata.markers.push(timelineMarker);
        this.config.events.onUpdated.dispatch(this);
    };
    /**
     * Removes a marker from the timeline (by reference) and returns `true` if the marker has
     * been part of the timeline and successfully removed, or `false` if the marker could not
     * be found and thus not removed.
     */
    UIManager.prototype.removeTimelineMarker = function (timelineMarker) {
        if (arrayutils_1.ArrayUtils.remove(this.config.metadata.markers, timelineMarker) === timelineMarker) {
            this.config.events.onUpdated.dispatch(this);
            return true;
        }
        return false;
    };
    return UIManager;
}());
exports.UIManager = UIManager;
/**
 * Encapsulates functionality to manage a UI instance. Used by the {@link UIManager} to manage multiple UI instances.
 */
var UIInstanceManager = /** @class */ (function () {
    function UIInstanceManager(player, ui, config) {
        this.events = {
            onConfigured: new eventdispatcher_1.EventDispatcher(),
            onSeek: new eventdispatcher_1.EventDispatcher(),
            onSeekPreview: new eventdispatcher_1.EventDispatcher(),
            onSeeked: new eventdispatcher_1.EventDispatcher(),
            onComponentShow: new eventdispatcher_1.EventDispatcher(),
            onComponentHide: new eventdispatcher_1.EventDispatcher(),
            onControlsShow: new eventdispatcher_1.EventDispatcher(),
            onPreviewControlsHide: new eventdispatcher_1.EventDispatcher(),
            onControlsHide: new eventdispatcher_1.EventDispatcher(),
            onRelease: new eventdispatcher_1.EventDispatcher(),
        };
        this.playerWrapper = new PlayerWrapper(player);
        this.ui = ui;
        this.config = config;
    }
    UIInstanceManager.prototype.getConfig = function () {
        return this.config;
    };
    UIInstanceManager.prototype.getUI = function () {
        return this.ui;
    };
    UIInstanceManager.prototype.getPlayer = function () {
        return this.playerWrapper.getPlayer();
    };
    Object.defineProperty(UIInstanceManager.prototype, "onConfigured", {
        /**
         * Fires when the UI is fully configured and added to the DOM.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onConfigured;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onSeek", {
        /**
         * Fires when a seek starts.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onSeek;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onSeekPreview", {
        /**
         * Fires when the seek timeline is scrubbed.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onSeekPreview;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onSeeked", {
        /**
         * Fires when a seek is finished.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onSeeked;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onComponentShow", {
        /**
         * Fires when a component is showing.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onComponentShow;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onComponentHide", {
        /**
         * Fires when a component is hiding.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onComponentHide;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onControlsShow", {
        /**
         * Fires when the UI controls are showing.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onControlsShow;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onPreviewControlsHide", {
        /**
         * Fires before the UI controls are hiding to check if they are allowed to hide.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onPreviewControlsHide;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onControlsHide", {
        /**
         * Fires when the UI controls are hiding.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onControlsHide;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onRelease", {
        /**
         * Fires when the UI controls are released.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onRelease;
        },
        enumerable: true,
        configurable: true
    });
    UIInstanceManager.prototype.clearEventHandlers = function () {
        this.playerWrapper.clearEventHandlers();
        var events = this.events; // avoid TS7017
        for (var event_1 in events) {
            var dispatcher = events[event_1];
            dispatcher.unsubscribeAll();
        }
    };
    return UIInstanceManager;
}());
exports.UIInstanceManager = UIInstanceManager;
/**
 * Extends the {@link UIInstanceManager} for internal use in the {@link UIManager} and provides access to functionality
 * that components receiving a reference to the {@link UIInstanceManager} should not have access to.
 */
var InternalUIInstanceManager = /** @class */ (function (_super) {
    __extends(InternalUIInstanceManager, _super);
    function InternalUIInstanceManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InternalUIInstanceManager.prototype.getWrappedPlayer = function () {
        // TODO find a non-hacky way to provide the WrappedPlayer to the UIManager without exporting it
        // getPlayer() actually returns the WrappedPlayer but its return type is set to Player so the WrappedPlayer does
        // not need to be exported
        return this.getPlayer();
    };
    InternalUIInstanceManager.prototype.configureControls = function () {
        this.configureControlsTree(this.getUI());
        this.configured = true;
    };
    InternalUIInstanceManager.prototype.isConfigured = function () {
        return this.configured;
    };
    InternalUIInstanceManager.prototype.configureControlsTree = function (component) {
        var _this = this;
        var configuredComponents = [];
        uiutils_1.UIUtils.traverseTree(component, function (component) {
            // First, check if we have already configured a component, and throw an error if we did. Multiple configuration
            // of the same component leads to unexpected UI behavior. Also, a component that is in the UI tree multiple
            // times hints at a wrong UI structure.
            // We could just skip configuration in such a case and not throw an exception, but enforcing a clean UI tree
            // seems like the better choice.
            for (var _i = 0, configuredComponents_1 = configuredComponents; _i < configuredComponents_1.length; _i++) {
                var configuredComponent = configuredComponents_1[_i];
                if (configuredComponent === component) {
                    // Write the component to the console to simplify identification of the culprit
                    // (e.g. by inspecting the config)
                    if (console) {
                        console.error('Circular reference in UI tree', component);
                    }
                    // Additionally throw an error, because this case must not happen and leads to unexpected UI behavior.
                    throw Error('Circular reference in UI tree: ' + component.constructor.name);
                }
            }
            component.initialize();
            component.configure(_this.getPlayer(), _this);
            configuredComponents.push(component);
        });
    };
    InternalUIInstanceManager.prototype.releaseControls = function () {
        // Do not call release methods if the components have never been configured; this can result in exceptions
        if (this.configured) {
            this.onRelease.dispatch(this.getUI());
            this.releaseControlsTree(this.getUI());
            this.configured = false;
        }
        this.released = true;
    };
    InternalUIInstanceManager.prototype.isReleased = function () {
        return this.released;
    };
    InternalUIInstanceManager.prototype.releaseControlsTree = function (component) {
        component.release();
        if (component instanceof container_1.Container) {
            for (var _i = 0, _a = component.getComponents(); _i < _a.length; _i++) {
                var childComponent = _a[_i];
                this.releaseControlsTree(childComponent);
            }
        }
    };
    InternalUIInstanceManager.prototype.clearEventHandlers = function () {
        _super.prototype.clearEventHandlers.call(this);
    };
    return InternalUIInstanceManager;
}(UIInstanceManager));
/**
 * Wraps the player to track event handlers and provide a simple method to remove all registered event
 * handlers from the player.
 */
var PlayerWrapper = /** @class */ (function () {
    function PlayerWrapper(player) {
        var _this = this;
        this.eventHandlers = {};
        this.player = player;
        // Collect all members of the player (public API methods and properties of the player)
        // (Object.getOwnPropertyNames(player) does not work with the player TypeScript class starting in 7.2)
        var members = [];
        for (var member in player) {
            members.push(member);
        }
        // Split the members into methods and properties
        var methods = [];
        var properties = [];
        for (var _i = 0, members_1 = members; _i < members_1.length; _i++) {
            var member = members_1[_i];
            if (typeof player[member] === 'function') {
                methods.push(member);
            }
            else {
                properties.push(member);
            }
        }
        // Create wrapper object
        var wrapper = {};
        var _loop_1 = function (method) {
            wrapper[method] = function () {
                // console.log('called ' + member); // track method calls on the player
                return player[method].apply(player, arguments);
            };
        };
        // Add function wrappers for all API methods that do nothing but calling the base method on the player
        for (var _a = 0, methods_1 = methods; _a < methods_1.length; _a++) {
            var method = methods_1[_a];
            _loop_1(method);
        }
        var _loop_2 = function (property) {
            // Get an eventually existing property descriptor to differentiate between plain properties and properties with
            // getters/setters.
            var propertyDescriptor = Object.getOwnPropertyDescriptor(player, property) ||
                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(player), property);
            // If the property has getters/setters, wrap them accordingly...
            if (propertyDescriptor && (propertyDescriptor.get || propertyDescriptor.set)) {
                Object.defineProperty(wrapper, property, {
                    get: function () { return propertyDescriptor.get.call(player); },
                    set: function (value) { return propertyDescriptor.set.call(player, value); },
                });
            }
            // ... else just transfer the property to the wrapper
            else {
                wrapper[property] = player[property];
            }
        };
        // Add all public properties of the player to the wrapper
        for (var _b = 0, properties_1 = properties; _b < properties_1.length; _b++) {
            var property = properties_1[_b];
            _loop_2(property);
        }
        // Explicitly add a wrapper method for 'on' that adds added event handlers to the event list
        wrapper.on = function (eventType, callback) {
            player.on(eventType, callback);
            if (!_this.eventHandlers[eventType]) {
                _this.eventHandlers[eventType] = [];
            }
            _this.eventHandlers[eventType].push(callback);
            return wrapper;
        };
        // Explicitly add a wrapper method for 'off' that removes removed event handlers from the event list
        wrapper.off = function (eventType, callback) {
            player.off(eventType, callback);
            if (_this.eventHandlers[eventType]) {
                arrayutils_1.ArrayUtils.remove(_this.eventHandlers[eventType], callback);
            }
            return wrapper;
        };
        wrapper.fireEventInUI = function (event, data) {
            if (_this.eventHandlers[event]) { // check if there are handlers for this event registered
                // Extend the data object with default values to convert it to a {@link PlayerEventBase} object.
                var playerEventData = Object.assign({}, {
                    timestamp: Date.now(),
                    type: event,
                    // Add a marker property so the UI can detect UI-internal player events
                    uiSourced: true,
                }, data);
                // Execute the registered callbacks
                for (var _i = 0, _a = _this.eventHandlers[event]; _i < _a.length; _i++) {
                    var callback = _a[_i];
                    callback(playerEventData);
                }
            }
        };
        this.wrapper = wrapper;
    }
    /**
     * Returns a wrapped player object that can be used on place of the normal player object.
     * @returns {WrappedPlayer} a wrapped player
     */
    PlayerWrapper.prototype.getPlayer = function () {
        return this.wrapper;
    };
    /**
     * Clears all registered event handlers from the player that were added through the wrapped player.
     */
    PlayerWrapper.prototype.clearEventHandlers = function () {
        try {
            // Call the player API to check if the instance is still valid or already destroyed.
            // This can be any call throwing the PlayerAPINotAvailableError when the player instance is destroyed.
            this.player.getSource();
        }
        catch (error) {
            if (error instanceof this.player.exports.PlayerAPINotAvailableError) {
                // We have detected that the player instance is already destroyed, so we clear the event handlers to avoid
                // event handler unsubscription attempts (which would result in PlayerAPINotAvailableError errors).
                this.eventHandlers = {};
            }
        }
        for (var eventType in this.eventHandlers) {
            for (var _i = 0, _a = this.eventHandlers[eventType]; _i < _a.length; _i++) {
                var callback = _a[_i];
                this.player.off(eventType, callback);
            }
        }
    };
    return PlayerWrapper;
}());
},{"./arrayutils":1,"./browserutils":3,"./components/container":19,"./components/uicontainer":67,"./dom":75,"./eventdispatcher":77,"./uiutils":88,"./volumecontroller":89}],88:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var container_1 = require("./components/container");
var UIUtils;
(function (UIUtils) {
    function traverseTree(component, visit) {
        var recursiveTreeWalker = function (component, parent) {
            visit(component, parent);
            // If the current component is a container, visit it's children
            if (component instanceof container_1.Container) {
                for (var _i = 0, _a = component.getComponents(); _i < _a.length; _i++) {
                    var childComponent = _a[_i];
                    recursiveTreeWalker(childComponent, component);
                }
            }
        };
        // Walk and configure the component tree
        recursiveTreeWalker(component);
    }
    UIUtils.traverseTree = traverseTree;
})(UIUtils = exports.UIUtils || (exports.UIUtils = {}));
},{"./components/container":19}],89:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var eventdispatcher_1 = require("./eventdispatcher");
/**
 * Can be used to centrally manage and control the volume and mute state of the player from multiple components.
 */
var VolumeController = /** @class */ (function () {
    function VolumeController(player) {
        var _this = this;
        this.player = player;
        this.events = {
            onChanged: new eventdispatcher_1.EventDispatcher(),
        };
        this.storeVolume();
        var handler = function () {
            _this.onChangedEvent();
        };
        player.on(player.exports.PlayerEvent.SourceLoaded, handler);
        player.on(player.exports.PlayerEvent.VolumeChanged, handler);
        player.on(player.exports.PlayerEvent.Muted, handler);
        player.on(player.exports.PlayerEvent.Unmuted, handler);
    }
    VolumeController.prototype.setVolume = function (volume) {
        this.player.setVolume(volume, VolumeController.issuerName);
    };
    VolumeController.prototype.getVolume = function () {
        return this.player.getVolume();
    };
    VolumeController.prototype.setMuted = function (muted) {
        if (muted) {
            this.player.mute(VolumeController.issuerName);
        }
        else {
            this.player.unmute(VolumeController.issuerName);
        }
    };
    VolumeController.prototype.toggleMuted = function () {
        if (this.isMuted() || this.getVolume() === 0) {
            // Unmuting from the mute or zero-volume state recalls the previously saved volume setting. Setting the
            // volume automatically unmutes the player in v7.
            this.recallVolume();
        }
        else {
            this.setMuted(true);
        }
    };
    VolumeController.prototype.toggleVolumeVisible = function () {
        var volToogle = document.querySelector('.bmpui-ui-volumeslider');
        volToogle.classList.toggle('active');
    };
    VolumeController.prototype.isMuted = function () {
        return this.player.isMuted();
    };
    /**
     * Stores (saves) the current volume so it can later be restored with {@link recallVolume}.
     */
    VolumeController.prototype.storeVolume = function () {
        this.storedVolume = this.getVolume();
    };
    /**
     * Recalls (sets) the volume previously stored with {@link storeVolume}.
     */
    VolumeController.prototype.recallVolume = function () {
        this.setMuted(this.storedVolume === 0);
        this.setVolume(this.storedVolume);
    };
    VolumeController.prototype.startTransition = function () {
        return new VolumeTransition(this);
    };
    VolumeController.prototype.onChangedEvent = function () {
        var playerMuted = this.isMuted();
        var playerVolume = this.getVolume();
        var uiMuted = playerMuted || playerVolume === 0;
        var uiVolume = playerMuted ? 0 : playerVolume;
        this.events.onChanged.dispatch(this, { volume: uiVolume, muted: uiMuted });
    };
    Object.defineProperty(VolumeController.prototype, "onChanged", {
        /**
         * Gets the event that is fired when the volume settings have changed.
         */
        get: function () {
            return this.events.onChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    VolumeController.issuerName = 'ui-volumecontroller';
    return VolumeController;
}());
exports.VolumeController = VolumeController;
var VolumeTransition = /** @class */ (function () {
    function VolumeTransition(controller) {
        this.controller = controller;
        // Store the volume at the beginning of a volume change so we can recall it later in case we set the volume to
        // zero and actually mute the player.
        controller.storeVolume();
    }
    VolumeTransition.prototype.update = function (volume) {
        // Update the volume while transitioning so the user has a "live preview" of the desired target volume
        this.controller.setMuted(false);
        this.controller.setVolume(volume);
    };
    VolumeTransition.prototype.finish = function (volume) {
        if (volume === 0) {
            // When the volume is zero we essentially mute the volume so we recall the volume from the beginning of the
            // transition and mute the player instead. Recalling is necessary to return to the actual audio volume
            // when unmuting.
            // We must first recall the volume and then mute, because recalling sets the volume on the player
            // and setting a player volume > 0 unmutes the player in v7.
            this.controller.recallVolume();
            this.controller.setMuted(true);
        }
        else {
            this.controller.setMuted(false);
            this.controller.setVolume(volume);
            this.controller.storeVolume();
        }
    };
    return VolumeTransition;
}());
exports.VolumeTransition = VolumeTransition;
},{"./eventdispatcher":77}]},{},[80])(80)
});