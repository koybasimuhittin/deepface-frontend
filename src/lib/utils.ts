import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export function min(a: number, b:number){
  return Math.min(a, b)
}

export function beautifyName(name: string){
  name = name.substring(9, name.length - 4)
  const splittedName = name.split("-")
  name = ""
  for(let i = 0; i < splittedName.length - 1; i++){
    name += splittedName[i][0].toUpperCase()
    name += splittedName[i].substring(1)
    name += " "
  }
  name += splittedName[splittedName.length - 1].toUpperCase()

  return name
}
