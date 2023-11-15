const fetch = require('node-fetch');

class HandposeHandler {
    

    // 바이너리 파일 전처리
    static async _bindPage () {
        // binary 
        const binaryDetector = await fetch('./tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/group1-shard1of1.bin');
        const blobDetector = HandposeDetector._b64toBlob(binaryDetector.default.slice(binaryDetector.default.indexOf('base64,') + 7))
        const urlDetector = URL.createObjectURL(blobDetector)
        console.log('urlDetector: ', urlDetector)
        const urlArrDetector = urlDetector.split("/");
        // console.log('urlArrDetector: ', urlArrDetector)

        const binaryLandmark = await fetch('./tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/group1-shard1of1.bin');
        const blobLandmark = HandposeDetector._b64toBlob(binaryLandmark.default.slice(binaryLandmark.default.indexOf('base64,') + 7))
        const urlLandmark = URL.createObjectURL(blobLandmark)
        const urlArrLandmark = urlLandmark.split("/");

        // json
        const jsonDetector = require('./tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/model.json');
        const jsonLandmark = require('./tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/model.json');
        jsonDetector.weightsManifest[0].paths[0] = urlArrDetector[urlArrDetector.length - 1];
        jsonLandmark.weightsManifest[0].paths[0] = urlArrLandmark[urlArrLandmark.length - 1];
        console.log('weightsManifest', jsonDetector.weightsManifest[0])
        console.log('weightsManifest', jsonLandmark.weightsManifest[0])

        // Create URLs for jsonDetector and jsonLandmark
        const blobJsonDetector = new Blob([JSON.stringify(jsonDetector)], {type: 'application/json'});
        const urlJsonDetector = URL.createObjectURL(blobJsonDetector);
        console.log('urlJsonDetector: ', urlJsonDetector)
        const blobJsonLandmark = new Blob([JSON.stringify(jsonLandmark)], {type: 'application/json'});
        const urlJsonLandmark = URL.createObjectURL(blobJsonLandmark);
        console.log('urlJsonLandmark: ', urlJsonLandmark)

        return { urlJsonDetector, urlJsonLandmark }
      }
    
    static _b64toBlob (b64Data, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    
    

}

module.exports = HandposeHandler;