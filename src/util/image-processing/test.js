const HandPosePredictor = require('./predictor-handpose'); 
const fs = require('fs');

async function run() {
    const predictor = new HandPosePredictor();

    // 이미지 파일을 Base64로 인코딩합니다.
    // 이 예제에서는 'image.jpg'라는 이름의 이미지 파일을 사용하였습니다. 실제 이미지 파일 이름으로 변경해야 합니다.
    const imageBuffer = fs.readFileSync('handpose1.png');
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // 예측을 실행하고 결과를 출력합니다.
    const predictions = await predictor.predict(`data:image/jpeg;base64,${imageBase64}`);
}

run().catch(console.error);
