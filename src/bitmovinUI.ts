/* tslint:disable:no-null-keyword */
import { QualityMetadata, SubtitleTrack, TrackMetadata } from 'bitmovin-player';
import {
  AudioQualitySelectBox,
  AudioTrackListBox,
  BufferingOverlay,
  CastStatusOverlay,
  CastToggleButton,
  Container,
  ControlBar,
  ErrorMessageOverlay,
  FullscreenToggleButton,
  PlaybackSpeedSelectBox,
  PlaybackTimeLabel,
  PlaybackTimeLabelMode,
  PlaybackToggleButton,
  PlaybackToggleOverlay,
  RecommendationOverlay,
  SeekBar,
  SeekBarLabel,
  SettingsPanel,
  SettingsPanelItem,
  SettingsPanelPage,
  SettingsToggleButton,
  Spacer,
  SubtitleListBox,
  SubtitleOverlay,
  TitleBar,
  UIContainer,
  VideoQualitySelectBox,
  VolumeSlider,
  VolumeToggleButton
} from 'bitmovin-player-ui';

// let uiCssPromise!: Promise<any> = undefined;

// // CSS lazy-loading
// export function loadUiCss(): Promise<any> {
//   if (!uiCssPromise) {
//     const href = `${process.env.CLIENT_ASSET_URL || ''}/`;
//     // uiCssPromise = injectCssOnce(href + 'bitmovin/bitmovinplayer-ui.min.css');

//     // uiCssPromise = Promise.all([cssPromis, jsPromis]);
//   }
//   return uiCssPromise;
// }

/**
 * Compose Bitmovin UI, separated because its provided by Telecine, so we can easily find and change it on their request
 */
export function createUIContainer(strings: { [key: string]: string }): UIContainer {
  const settingsPanel = new SettingsPanel({
    components: [
      new SettingsPanelPage({
        components: [
          new SettingsPanelItem(strings['bitmovin_ui_video_quality'], new VideoQualitySelectBox()),
          new SettingsPanelItem(strings['bitmovin_ui_video_speed'], new PlaybackSpeedSelectBox()),
          new SettingsPanelItem(strings['bitmovin_ui_audio_quality'], new AudioQualitySelectBox())
        ]
      })
    ],
    hidden: true
  });

  const subtitleListBox = new SubtitleListBox();
  const subtitleSettingsPanel = new SettingsPanel({
    components: [
      new SettingsPanelPage({
        components: [new SettingsPanelItem('', subtitleListBox)]
      })
    ],
    pageTransitionAnimation: false,
    hidden: true
  });

  let audioTrackListBox = new AudioTrackListBox();
  let audioTrackSettingsPanel = new SettingsPanel({
    components: [
      new SettingsPanelPage({
        components: [new SettingsPanelItem('', audioTrackListBox)]
      })
    ],
    pageTransitionAnimation: false,
    hidden: true
  });

  const controlBar = new ControlBar({
    components: [
      audioTrackSettingsPanel,
      subtitleSettingsPanel,
      settingsPanel,
      new Container({
        components: [
          new SeekBar({ label: new SeekBarLabel() }),
          new PlaybackTimeLabel({
            timeLabelMode: PlaybackTimeLabelMode.CurrentAndTotalTime,
            cssClasses: ['text-right']
          })
        ],
        cssClasses: ['controlbar-top']
      }),
      new Container({
        components: [
          new PlaybackToggleButton(),
          new VolumeToggleButton(),
          new VolumeSlider(),
          new Spacer(),
          // new PictureInPictureToggleButton(),
          new SettingsToggleButton({
            settingsPanel: audioTrackSettingsPanel,
            cssClass: 'ui-audiotracksettingstogglebutton'
          }),
          new SettingsToggleButton({
            settingsPanel: subtitleSettingsPanel,
            cssClass: 'ui-subtitlesettingstogglebutton'
          }),
          // new SettingsToggleButton({ settingsPanel: settingsPanel }),
          new CastToggleButton(),
          new FullscreenToggleButton()
        ],
        cssClasses: ['controlbar-bottom']
      })
    ]
  });

  return new UIContainer({
    components: [
      new SubtitleOverlay(),
      new BufferingOverlay(),
      new PlaybackToggleOverlay(),
      new CastStatusOverlay(),
      controlBar,
      new TitleBar(),
      new RecommendationOverlay(),
      new ErrorMessageOverlay()
    ]
  });
}

// WARNING:
// We can't use in caption's functions any translation because it brakes Chromecast
// casting supposly because main app's context becomes unavailable

/**
 * Quality names for UI
 */
export function getQualityLabels(strings: { [key: string]: string }) {
  return function(quality: QualityMetadata) {
    if (!quality.width) {
      return;
    }
    if (quality.width >= 1920) {
      return quality.width + ' (Full HD)';
    } else if (quality.width >= 1200) {
      return quality.width + ' (HD)';
    } else if (quality.width < 1200) {
      return quality.width + ' (Resolução Baixa)'; // ` (${strings['bitmovin_ui_low_res']}]})`;
    }
    return quality.width.toString();
  };
}

/**
 * Subtitle labels for UI
 */
export function getSubtitleLabels(strings: { [key: string]: string }) {
  return function(subtitle: SubtitleTrack): string {
    if (!subtitle) return '';
    return 'Ligado'; // strings['bitmovin_ui_subtitle_dubbed'];;
  };
}

/**
 * Audio labels for UI
 */
export function getTrackLabels(strings: { [key: string]: string }) {
  return function(trackMetadata: TrackMetadata): string {
    if (trackMetadata.lang === 'pt') {
      return 'Português'; // strings['bitmovin_ui_lang_pt'];
    } else {
      return 'Inglês'; // strings['bitmovin_ui_lang_en'];
    }
  };
}
