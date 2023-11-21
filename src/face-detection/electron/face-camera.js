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
        // video, canvas, context 
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
}

module.exports = Camera;