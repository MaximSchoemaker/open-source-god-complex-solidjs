import { getMedia, cancelMedia } from "./mediaLoader";

export function getImage(src: string) {
  return getMedia<HTMLImageElement>({
    id: src,
    construct: (onLoad) => {
      const image = new Image();
      image.onload = () => onLoad();
      // image.onerror = () => onError();
      // image.onabort = () => onAbort();
      image.src = src;
      return image;
    },
    cleanup: (image) => {
      image.src = "";
    },
  });
}

export function cancelImage(src: string) {
  cancelMedia<HTMLImageElement>(src);
}
