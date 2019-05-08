import { Player, SourceConfig } from 'bitmovin-player';
import { UIFactory } from 'bitmovin-player-ui';
import React from 'react';
import './App.css';

class App extends React.Component<any, any> {
  playerConfig = {
    key: '4030a021-73c5-48f7-b90f-7e36107e1391',
    ui: false,
    location: {
      ui: '/bitmovin/bitmovinplayer-ui.js',
      ui_css: '/bitmovin/bitmovinplayer-ui.css'
    }
  };
  playerSource: SourceConfig = {
    dash: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    hls: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    progressive:
      'https://bitdash-a.akamaihd.net/content/MI201109210084_1/MI201109210084_mpeg-4_hd_high_1080p25_10mbits.mp4',
    poster: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
    thumbnailTrack: {
      url:
        'https://fs.telecinecloud.com/filmstrips/Telecine_-_Staging/42/317/1759378_54693445892_mp4_video_480x270_272000_all_audio_1.vtt'
    }
  };

  // if (this.smil.imageStream) {
  //   const url = new URL(this.smil.imageStream.src);
  //   const imageStream = `//fs.telecinecloud.com${url.pathname.replace('fs', 'vtt')}`;
  //   // const imageStream =
  //   // 	'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/thumbnails/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.vtt';
  //   this.playerSource.thumbnailTrack = {
  //     url: imageStream
  //   };
  // }

  componentDidMount(): void {
    this.setupPlayer();
  }

  setupPlayer() {
    const player = new Player(document.getElementById('player')!, this.playerConfig);

    const playerUI = UIFactory.buildDefaultUI(player);

    player.load(this.playerSource).then(
      () => {
        this.setState({
          ...this.state,
          player
        });
        console.log('Successfully loaded source');
      },
      () => {
        console.log('Error while loading source');
      }
    );
  }

  render() {
    return (
      <div>
        <h1>stuff</h1>
        <div id="player" />
      </div>
    );
  }
}

export default App;
