import { createEffect, createRenderEffect, createResource, createSignal, onCleanup, untrack } from "solid-js";
import { getImage, cancelImage } from "../controllers/imageLoader";

// window.oncontextmenu = function (event) {
//    event.preventDefault();
//    event.stopPropagation();
//    return false;
// };

type mipmapType = {
   width: number;
   height: number;
   src: string;
}

type ImagePreviewProps = {
   mipmaps: mipmapType[];
   src: string;
   filename: string;
   item_index: number;
   background_color: string;

   cols: () => number;
   item_x: () => number;
   item_y: () => number;
   item_size: () => number;
}

const ImagePreview = (props: ImagePreviewProps) => {
   let a_ref: HTMLAnchorElement | undefined;

   const [mipmap_index, set_mipmap_index] = createSignal(0);
   const [hovering, set_hovering] = createSignal(false);
   const [loading, set_loading] = createSignal(false);
   const [appear_ended, set_appear_ended] = createSignal(false);

   const alway_show = () => false; //props.cols() == 1;
   const should_appear = () => !(image().cached || loaded_before)
   const should_appear_animation = () => props.cols() > 1;
   const appear_animation = () => !should_appear() ? ""
      : should_appear_animation() ? "scale-fade-in" : "fade-in"

   const transform = (() => `translate(${props.item_x()}px, ${props.item_y()}px)`);

   const mipmap = () => props.mipmaps.at(appear_ended()
      ? mipmap_index()
      : mipmap_index() - 1
   );

   const src = () => mipmap()?.src ?? props.src;

   const dimensions = () => ({
      width: mipmap()?.width ?? 1080,
      height: mipmap()?.height ?? 1080
   })

   // const scale = createMemo(() => Math.pow(
   //    1 - (Math.cos(
   //       Math.max(0, Math.min(1,
   //          ((props.item_screen_y() + props.item_size() / 2) / window.innerHeight)
   //          * 0.5 + 0.25
   //       ))
   //       * Math.PI * 2) * 0.5 + 0.5),
   //    1
   // ));

   // const image_style = (() => ({
   //    transform: `scale(${scale() ?? 0})`,
   //    // opacity: scale(),
   // }));

   onCleanup(() => cancelImage(src()));

   const [image] = createResource(src, getImage);

   createEffect(() => {
      const scale = window.devicePixelRatio;
      const item_physical_size = props.item_size() * scale;

      let new_mipmap_index = props.mipmaps.map((mipmap, i) =>
         ({ ...mipmap, i, dist: Math.min(Math.abs(mipmap.width - item_physical_size), Math.abs(mipmap.width - item_physical_size)) })
      ).reduce((min, mipmap) => min
         ? mipmap.dist < min.dist ? mipmap : min
         : mipmap).i;

      set_mipmap_index(new_mipmap_index);
   });


   let loaded_before = false;
   createRenderEffect(() => {
      // image.error && console.log("error!", src());
      setTimeout(() => set_loading(image.loading))

      if (!image.loading) {
         const _appear_animation = untrack(appear_animation);
         image().className = _appear_animation;
         if (_appear_animation === "")
            set_appear_ended(true);
         image().onanimationend = () => set_appear_ended(true);

         // if (image().naturalWidth * 0.5 < props.item_size() || image().naturalHeight * 0.5 < props.item_size())
         //    image().style.setProperty("image-rendering", "pixelated");
         // else
         //    image().style.removeProperty("image-rendering");

         if (image().src)
            loaded_before = true;
      }
   });


   return (
      <div
         class={`image-preview-container`}
         style={{
            transform: transform(),
            width: props.item_size() + "px",
            "--item_index": props.item_index,
            "background-color": props.background_color,
         }}
         onpointerover={({ pointerType }) => pointerType === "mouse" && set_hovering(true)}
         onpointerout={({ pointerType }) => pointerType === "mouse" && set_hovering(false)}
         tabindex={props.item_index.toString()}
         onfocus={() => a_ref!.focus({ preventScroll: true })}
      >
         {image()}

         <div
            class={`image-preview-overlay ${hovering() ? "show" : ""} ${alway_show() ? "always-show" : ""}`}
            onblur={() => set_hovering(false)}
            onfocus={() => set_hovering(true)}
         >
            <a
               class="label"
               ref={a_ref}
               style={{ position: "sticky", top: `calc(var(--header-height) - ${props.item_y()}px)`, left: 0 }}
            // href={`/media/${props.id}`}
            >
               {props.filename}
            </a>

            <span
               class="label"
               style={{ position: "sticky", bottom: `${props.item_y()}px`, left: 0 }}
            >
               {image()?.naturalWidth ?? dimensions().width}x{image()?.naturalHeight ?? dimensions().height} {appear_ended().toString()}
            </span>
         </div>

         <div class={`loading-animation ${loading() ? "active" : ""}`} />
      </div>
   )
}

export default ImagePreview;