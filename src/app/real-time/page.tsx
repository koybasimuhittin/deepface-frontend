'use client'

import React from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { beautifyName, cn, delay } from "@/lib/utils" 
import axios from 'axios';
import { BACKEND_URL } from '@/config';
import { useToast } from '@/components/ui/use-toast';
import { FiUser } from 'react-icons/fi';


const VIDEO_CONSTRAINTS = {
  width: 480,
  height: 360,
  facingMode: "user"
};

export default function Page() {

    const [webcamState, setWebcamState] = React.useState<"loading" | "success" | "error">("loading")

    const [modelLoaded, setModelLoaded] = React.useState(false);

    const [loading, setLoading] = React.useState(false)
    const [recognizedPerson, setRecognizedPerson] = React.useState<string | null>(null)
    
    
    let unknownTry = 0;
    let undefinedTry = 20;

    let faceMatcher: any;
    let lastDetection: any = null;
    
    const { toast } = useToast()


    const webcamRef = React.useRef<Webcam>(null)


    const capture = React.useCallback(
        () => {
            const canvas = webcamRef.current!.getCanvas();
            const image = webcamRef.current!.getScreenshot()
            return {canvas: canvas as HTMLCanvasElement, image: image as string}
        },
        [webcamRef]
    );

    const recognize = async(image : String) => {
        try{
        const res = await axios.post(BACKEND_URL + "/recognize", {
            img_path: image
        })
        
        if(res.status === 200){
            if(res.data.result === "unknown"){
                toast({
                    title: "Unknown Face",
                    description: "We could't find you in the facial database please upload a photo of your face",
                })
                setRecognizedPerson(null)
                unknownTry += 1;
            }
            else{
                setLoading(false)
                setRecognizedPerson(res.data.result)
                console.log(res.data.result)
                unknownTry = 0;
            }
        }
        }catch(e: any){
            if(e.response.data.error.includes("Face could not be detected")){
                toast({
                    title: "Failed",
                    description: "We could not detect any face in the image please try again",
                    variant: "destructive"
                })
            }
            if(e.response.data.error.includes("No item found in database")){
                toast({
                    title: "Failed",
                    description: "There is no record in the facial database please upload a photo of your face",
                    variant: "destructive"
                })
                setLoading(false)
                setRecognizedPerson(null)
            }
        }finally{
            setLoading(false)
        }
  }


    const detectFace = async() => {
        if(loading)return;
        try{
            const {canvas, image} = (await capture())

            const detection = await faceapi.detectSingleFace(canvas, new faceapi.MtcnnOptions({})).withFaceLandmarks().withFaceDescriptor()

            if(typeof(detection) === typeof(undefined)){
                undefinedTry += 1
                if(undefinedTry == 10){
                    setRecognizedPerson("");
                }
                return;
            }


            if(undefinedTry >= 10 && !loading && (!recognizedPerson || recognizedPerson == "")){
                undefinedTry = 0;
                setLoading(true);
                await delay(500);
                const {canvas, image} = (await capture())
                if(lastDetection != null){
                    const match = faceMatcher.findBestMatch(detection)
                    console.log(match)
                }
                else{
                    lastDetection = detection;
                    console.log(lastDetection)
                    faceMatcher = new faceapi.FaceMatcher(detection)
                }
                await recognize(image)
            }
            undefinedTry = 0;
            
        }catch(e){
            console.log(e)
            undefinedTry += 1;
        }
    }

    React.useEffect(() => {
        const loadModel = async() => {
            await faceapi.nets.mtcnn.loadFromUri('/models')
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            setModelLoaded(true)
        }

        loadModel();                   
    }, [])

    React.useEffect(() => {
        console.log(modelLoaded)
        if(modelLoaded){
            const intervalId = setInterval(async() => {
                await detectFace();
            }, 200);

            return () => clearInterval(intervalId);
        }
        
    }, [modelLoaded]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className='flex md:flex-row flex-col gap-4'>
                <div className={cn("relative w-fit h-fit border-none")}>
                    <Webcam
                        audio={false}
                        height={VIDEO_CONSTRAINTS.height}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={VIDEO_CONSTRAINTS.width}
                        videoConstraints={VIDEO_CONSTRAINTS}
                        onUserMedia={() => {
                            setWebcamState("success")
                        }}
                        onUserMediaError={() => {
                            setWebcamState("error")
                        }}
                    />
                </div>
            </div>
           
            {recognizedPerson !== "" && recognizedPerson !== null && <span className="flex gap-2 text-green-500 text-3xl">
                <FiUser />
                <p>
                    Hello! {beautifyName(recognizedPerson)}
                </p>
            </span>
            }
            
            
        </div>
    );
}
