'use client'

import React from "react";
import Webcam from "react-webcam";
import Image from "next/image";

import { beautifyName, cn, delay, min } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

import ClipLoader from "react-spinners/ClipLoader"

import { LuScanFace } from "react-icons/lu";
import { MdOutlineFileUpload } from "react-icons/md";
import { MdOutlineCameraAlt } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { FiUser } from "react-icons/fi";


import { BACKEND_URL } from "@/config";
import axios from "axios";



const VIDEO_CONSTRAINTS = {
  width: 480,
  height: 360,
  facingMode: "user"
};
const CAPTURE_TIMER = 3000 //ms


export default function Home() {
  
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null)
  const [name, setName] = React.useState<string>("")
  const [webcamState, setWebcamState] = React.useState<"loading" | "success" | "error">("loading")
  const [appState, setAppState] = React.useState<"initial" | "upload" | "recognize">("initial")
  const [loading, setLoading] = React.useState(false)
  const [recognizedPerson, setRecognizedPerson] = React.useState<string | null>(null)
  const [timerState, setTimerState] = React.useState({
    remainingTime: 0,
    showTimer: false,
    showTimerBorder: false
  })
  
  const webcamRef = React.useRef<Webcam>(null)

  const { toast } = useToast()


  const capture = React.useCallback(
    () => {
      const imageSrc = webcamRef.current!.getScreenshot();
      return imageSrc as string
    },
    [webcamRef]
  );

  const handleCapture = async() => {
    const timerStart = Number(Date.now());
    let capturedImage = "";

    const interval = setInterval(async() => {
      setTimerState({remainingTime: Math.ceil((CAPTURE_TIMER - (Number(Date.now()) - timerStart)) / 1000 + 1), showTimer: true, showTimerBorder: true});
      await delay(500)
      setTimerState({...timerState, showTimerBorder: false})
    }, 1000)
    await delay(CAPTURE_TIMER + 1000);
    clearInterval(interval)
    setTimerState({...timerState, showTimerBorder: true})
    capturedImage = capture();
    await delay(500);
    setTimerState({...timerState, showTimerBorder: false})
    
    return capturedImage;
  }


  const handleUpload = async() => {
    const image = await handleCapture()
    setCapturedImage(image);
    setAppState("upload");
  }

  const handleUploadConfirm = async() => {
    if(name.length < 4){
      toast({
          title: "Insufficent Name",
          description: "Your name should be at least 4 character",
          variant: "destructive"
      })
      return;
    }
    setLoading(true)
    try{
      const res = await axios.post(BACKEND_URL + "/upload", {
        name: name,
        img_path: capturedImage
      })

      if(res.status == 200){
        toast({
          title: "Success",
          description: "Your image is uploaded to the facial database",
        })
        setAppState("initial")
        setName("")
      }
      else{
        toast({
          title: "Failed",
          description: res.data.message,
        })
      }
    }catch(e: any){
      if(e.response.data.error.includes("Face could not be detected")){
        toast({
            title: "Failed",
            description: "We could not detect any face in the image please try again",
            variant: "destructive"
          })
      }
      setAppState("initial")
      setName("")
    }finally{
      setLoading(false)
    }
  }

  const handleUploadCancel = () => {
    setAppState("initial")
    setName("")
  }

  const handleRecognize = async() => {
    const image = await handleCapture()
    setCapturedImage(image);
    setAppState("recognize");


    setLoading(true)
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
        }
        else{
          toast({
            title: "Face Recognized",
            description: "Your face hass been recognized successfully",
          })
          setLoading(false)
          setRecognizedPerson(res.data.result)
          await delay(3000)
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
        await delay(3000)
      }
    }finally{
      setRecognizedPerson(null)
      setAppState("initial")
      setLoading(false)
    }
  }

  if(appState === "upload"){
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Image src={capturedImage as string} alt="captured_image" width={VIDEO_CONSTRAINTS.width} height={VIDEO_CONSTRAINTS.height}/>
        <div className="flex gap-4" style={{width: VIDEO_CONSTRAINTS.width}}>
          <Input type="text" placeholder="Your Name" disabled={loading} value={name} onChange={(e) => {
            setName(e.target.value)
          }} className="border-2" />
        </div>
        <ClipLoader
          loading={loading}
          size={40}
          color="white"
          aria-label="Loading Spinner"
          data-testid="loader"
        />
        {
          !loading &&  
          <div className="flex gap-4">
           <Button variant={'default'} onClick={() => {handleUploadConfirm()}} className="flex gap-2"> 
            <span>
              Upload
            </span>
            <MdOutlineFileUpload className="h-6 w-6"/>
           </Button>

            <Button variant={'destructive'} onClick={() => {
              handleUploadCancel()
            }} className="flex gap-2">
              <span>
                Cancel
              </span>
              <RxCross2 className="h-6 w-6"/>
            </Button>
          </div>
        }
       
      </div>
    )
  }

  else if(appState === "recognize"){
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        {recognizedPerson !== null && <span className="flex gap-2 text-green-500 text-3xl">
            <FiUser />
            <p>
              Hello! {beautifyName(recognizedPerson)}
            </p>
          </span>
        }
        <div className="relative flex items-center justify-center">
          <Image className="" src={capturedImage as string} alt="captured_image" width={VIDEO_CONSTRAINTS.width} height={VIDEO_CONSTRAINTS.height}/>
          {loading && <div className="absolute top-0 left-0 backdrop-blur-xl bg-black opacity-80" style={{width: VIDEO_CONSTRAINTS.width, height: VIDEO_CONSTRAINTS.height }}/>}
          <ClipLoader
            loading={loading}
            size={min(VIDEO_CONSTRAINTS.width, VIDEO_CONSTRAINTS.height) / 2}
            color="white"
            aria-label="Loading Spinner"
            data-testid="loader"
            className="absolute"
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className={cn("relative w-fit h-fit border-white", timerState.showTimerBorder ? "border-2" : "border-none")}>
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
        <span className="absolute text-white text-3xl z-20" style={{top: VIDEO_CONSTRAINTS.height/2, left: VIDEO_CONSTRAINTS.width/2}}>
          {timerState.showTimer && timerState.remainingTime}
        </span>
      </div>
      <div className="flex gap-4">
        <Button variant={'default'} onClick={() => {handleRecognize()}} disabled={timerState.showTimer} className="flex gap-2">
          <span>
            Recognize
          </span>
          <LuScanFace className="h-6 w-6"/>
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={'secondary'} onClick={() => {handleUpload()}} disabled={timerState.showTimer} className="flex gap-2"> 
              <span>
                Capture Your Face
              </span>
              <MdOutlineCameraAlt className="h-6 w-6"/>
            </Button>
          </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center justify-center text-center">Capture your face and upload it <br/> to the facial database</p>
            </TooltipContent>
        </Tooltip>

      </div>
    </div>
  );
}
