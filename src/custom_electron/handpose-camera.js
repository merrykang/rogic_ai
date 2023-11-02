/***********
카메라 세팅
***********/
  
// 카메라 클래스 
// setupCamera(): 비디오 스트림을 가져와 카메라 객체를 설정
// 비디오 프레임에 손의 키포인트를 그리는 함수들 : drawCtx(), clearCtx(), drawResults(hands), drawResult(hand), drawEmoticon(keypoints), is_up_or_down(keypoints, is_up), drawKeypoints(keypoints, handedness), drawPath(points, closePath), drawPoint(y, x, r)

// 손 키포인트 매칭(딕셔너리)
const fingerLookupIndices = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

// 기기별 설정
  function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isAndroid() {
  return /Android/i.test(navigator.userAgent);
  }

  function isMobile() {
  return isAndroid() || isiOS();
  }

class Camera {
    constructor() {
      this.video = document.getElementById('video');
      this.canvas = document.getElementById('output');
      this.ctx = this.canvas.getContext('2d');
    }
  
    // 비디오 스트림을 가져와 카메라 객체를 설정 : 웹캠을 사용하여 실시간으로 비디오 스트림을 받아오고, 이를 후속 처리에 이용할 수 있게 됨
    static async setupCamera() {
      // navigator.mediaDevices.getUserMedia 함수 지원 확인 : 웹캠에 접근하여 비디오 스트림을 가져올 수 있는 api
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Browser API navigator.mediaDevices.getUserMedia not available');
      }
      
      // 비디오 설정 : 모바일 디바이스인 경우 $m_size, 아닌 경우 $size
      const $size = { width: 480, height: 360 };
      const $m_size = { width: 480, height: 360 };
      const videoConfig = {
        'audio': false,
        'video': {
          facingMode: 'user',
          // Only setting the video to a specified size for large screen, on
          // mobile devices accept the default size.
          width: isMobile() ? $m_size.width : $size.width,
          height: isMobile() ? $m_size.height : $size.height,
        }
      };
      
      // 비디오 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
      
      // 카메라 설정 : 비디오 요소(camera.video)에 스트림 설정
      const camera = new Camera();
      camera.video.srcObject = stream;
      
      // 비디오 로드 완료 대기 : video.onloadedmetadata 이벤트 사용하여 비디오의 메타 데이터 로드가 완료될 때까지 대기
      await new Promise((resolve) => {
        camera.video.onloadedmetadata = () => {
          resolve(video);
        };
      });
      
      // 비디오 재생
      camera.video.play();
      
      // 비디오 및 캔버스 크기 설정 : 비디오 크기 설정 -> 캔버스 크기를 비디오 크기와 동일하게 설정
      const videoWidth = camera.video.videoWidth;
      const videoHeight = camera.video.videoHeight;
      // Must set below two lines, otherwise video element doesn't show.
      camera.video.width = videoWidth;
      camera.video.height = videoHeight;
  
      camera.canvas.width = videoWidth;
      camera.canvas.height = videoHeight;
      const canvasContainer = document.querySelector('.canvas-wrapper');
      canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;
  
      // 비디오 좌우 반전 : 비디오 이미지가 거울처럼 표시되므로 ctx.scale(-1, 1)을 사용하여 좌우 반전
      camera.ctx.translate(camera.video.videoWidth, 0);
      camera.ctx.scale(-1, 1);
  
      return camera;
    }

    // 비디오 프레임을 캔버스에 그리는 함수 : ctx.drawImage()
    drawCtx() {
        this.ctx.drawImage(
        this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
    }
    
    // 캔버스를 지우는 함수 : ctx.clearRect()
    clearCtx() {
        this.ctx.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight);
    }

  /**
    * 손의 키포인트를 비디오에 그리는 함수 
    * hands : 그려야할 손의 목록
    * 손을 오른쪽에서 왼쪽으로 정렬 -> 손이 없는 경우를 고려하여 패딩을 추가 -> 각 손에 대해 drawResult() 함수를 호출하여 그림
    * @param hands A list of hands to render.
    */
    drawResults(hands) {
        // 손을 오른쪽에서 왼쪽으로 정렬
        hands.sort((hand1, hand2) => {
        if (hand1.handedness < hand2.handedness) return 1;
        if (hand1.handedness > hand2.handedness) return -1;
        return 0;
        });

        // 손이 없는 경우를 고려하여 패딩을 추가
        while (hands.length < 2) hands.push({});
        
        // 각 손에 대해 drawResult() 함수를 호출하여 그림
        for (let i = 0; i < hands.length; ++i) {

        this.drawResult(hands[i]);
        }
    }

  /**
    * 키포인트를 그리는 함수
    * hand는 그려야 할 손의 키포인트와 손잡이 정보를 포함하는 객체
    * @param hand A hand with keypoints to render.
    * @param ctxt Scatter GL context to render 3D keypoints to.
    */
    drawResult(hand) {
        if (hand.keypoints != null) {
        // drawKeypoints() : 키포인트를 그림;  drawEmoticon(): 감정 표현을 그림
        this.drawKeypoints(hand.keypoints, hand.handedness);
        }
}
  
    // x축을 기준으로 손의 키포인트를 사용하여 손가락의 상승 또는 하강 여부를 판단
    // keypoints: 키포인트의 배열; is_up: 상승 여부를 나타내는 boolean 값
    is_up_or_down(keypoints, is_up) {
        const keypointsArray = keypoints;
        // for x axis
        const wrist = keypointsArray[0].x;
        const index_finger_pip = keypointsArray[6].x;
        const index_finger_tip = keypointsArray[8].x;
        const ring_finger_pip = keypointsArray[14].x;
        const ring_finger_tip = keypointsArray[16].x;

        if (
        (wrist > index_finger_pip
            && index_finger_tip > index_finger_pip
            && ring_finger_tip > ring_finger_pip)
        || (wrist < index_finger_pip
            && index_finger_tip < index_finger_pip
            && ring_finger_tip < ring_finger_pip)) {
        if (is_up == true) {
            return 'up'
        }
        else {
            return 'down'
        }
        }
        else {
        return 'none'
        }
  }

  /**
    * 손의 키포인트를 그리는 함수
    * @param keypoints 키포인트의 배열 
    * @param handedness 손잡이 정보 (왼쪽 또는 오른쪽)
    */
    drawKeypoints(keypoints, handedness) {
        const keypointsArray = keypoints;
        this.ctx.fillStyle = handedness === 'Left' ? 'Red' : 'Blue';
        this.ctx.strokeStyle = 'White';
        this.ctx.lineWidth = 2;
        
        // 각 키포인트를 캔버스에 그림 
        for (let i = 0; i < keypointsArray.length; i++) {
        const y = keypointsArray[i].x;
        const x = keypointsArray[i].y;
        this.drawPoint(x - 2, y - 2, 3);
        }
        
        // 손가락 간 경로를 그림
        const fingers = Object.keys(fingerLookupIndices);
        for (let i = 0; i < fingers.length; i++) {
        const finger = fingers[i];
        const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
        this.drawPath(points, false);
        }
  }
  
  /**
  * 점들의 경로를 그리는 함수
  * @param points : 점들의 배열
  * @param closePath : 경로를 닫을지 여부
  * Path2D 객체를 사용 -> 점들을 연결 -> 경로를 그림
  */ 
    drawPath(points, closePath) {
        const region = new Path2D();
        region.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point.x, point.y);
        }

        if (closePath) {
        region.closePath();
        }
        this.ctx.stroke(region);
  }
  
  // 점을 그리는 함수 : x, y 좌표를 중심으로 한 반지름 r의 원을 그림
    drawPoint(y, x, r) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }


}

module.exports = Camera;
