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

    /**
     * 카메라 기본 설정
     */
    
    static async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(
                'Browser API navigator.mediaDevices.getUserMedia not available');
        }
        
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
        
        const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
        
        const camera = new Camera();
        camera.video.srcObject = stream;
        
        await new Promise((resolve) => {
            camera.video.onloadedmetadata = () => {
                resolve(video);
            };
        });
        
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
    
        camera.ctx.translate(camera.video.videoWidth, 0);
        camera.ctx.scale(-1, 1);
    
        return camera;
    }
  
    drawCtx() {
        this.ctx.drawImage(
            this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
    }
      
    clearCtx() {
        this.ctx.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight);
    }

    /**
     * draw(canvas) 관련 함수들
     */
    function drawPath(ctx, points, closePath) {
        const region = new Path2D();
        region.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          region.lineTo(point[0], point[1]);
        }
      
        if (closePath) {
          region.closePath();
        }
        ctx.stroke(region);
      }
      
      /**
       * Draw the keypoints on the video.
       * @param ctx 2D rendering context.
       * @param faces A list of faces to render.
       * @param boundingBox Whether or not to display the bounding box.
       * @param showKeypoints Whether or not to display the keypoints.
       */
      export function drawResults(ctx, faces, boundingBox, showKeypoints) {
        faces.forEach((face) => {
          const keypoints =
              face.keypoints.map((keypoint) => [keypoint.x, keypoint.y]);
      
          if (boundingBox) {
            ctx.strokeStyle = RED;
            ctx.lineWidth = 1;
      
            const box = face.box;
            drawPath(
                ctx,
                [
                  [box.xMin, box.yMin], [box.xMax, box.yMin], [box.xMax, box.yMax],
                  [box.xMin, box.yMax]
                ],
                true);
          }
      
          if (showKeypoints) {
            ctx.fillStyle = GREEN;
      
            for (let i = 0; i < NUM_KEYPOINTS; i++) {
              const x = keypoints[i][0];
              const y = keypoints[i][1];
      
              ctx.beginPath();
              ctx.arc(x, y, 3 /* radius */, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        });
      }
}

module.exports = Camera;