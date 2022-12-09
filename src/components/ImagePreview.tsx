import { createEffect, createRenderEffect, createResource, createSignal, onCleanup, Show, untrack } from "solid-js";
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
   // const [loaded_before, set_loaded_before] = createSignal(false);

   const always_show = () => false; //props.cols() == 1;
   const should_appear = () => !(image()?.cached || loaded_before)
   const should_appear_animation = () => props.cols() > 1;
   const appear_animation = () => !should_appear() ? ""
      : should_appear_animation() ? "fade-in" : "fade-in"

   const transform = (() => `translate(${props.item_x()}px, ${props.item_y()}px)`);

   const mipmap = () => props.mipmaps.at(
      mipmap_index()
      // appear_ended()
      //    ? mipmap_index()
      //    : mipmap_index() - 1
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
   createRenderEffect((prev_loading) => {
      // image.error && console.log("error!", src());

      // setTimeout(() => set_loading(image.loading))
      const loading = image.loading;
      const _image = untrack(image);

      if (!loading && prev_loading) {
         // const _loaded_before = untrack(loaded_before);

         // _image.className = untrack(appear_animation);
         _image.className = !should_appear_animation() || loaded_before || _image.cached ? "" : "fade-in";
         set_appear_ended(loaded_before || _image.cached);

         // if (!untrack(should_appear))
         //    set_appear_ended(true);
         // _image.onanimationend = () => set_appear_ended(true);

         // if (_image.naturalWidth * 0.5 < props.item_size() || _image.naturalHeight * 0.5 < props.item_size())
         //    _image.style.setProperty("image-rendering", "pixelated");
         // else
         //    _image.style.removeProperty("image-rendering");
         // console.log(loaded_before);
      }

      if (!loading) {
         loaded_before = true;

         _image.onanimationend = () => {
            _image.className = "";
            set_appear_ended(true);
         }
      }

      return loading;
   }, image.loading);

   return (
      <div
         class={`image-preview-container ${!should_appear_animation() || appear_ended() ? "" : "fade-in"}`}
         style={{
            transform: transform(),
            width: props.item_size() + "px",
            "--item_index": props.item_index,
            "background-color": "transparent",
            "background-image": image.loading && `url("${props.mipmaps[0].src.replaceAll("\\", "/")}")`,
            "background-size": "cover",
         }}
         // onpointerover={({ pointerType }) => pointerType === "mouse" && set_hovering(true)}
         // onpointerout={({ pointerType }) => pointerType === "mouse" && set_hovering(false)}
         onmouseover={() => set_hovering(true)}
         onmouseout={() => set_hovering(false)}
         tabindex={props.item_index.toString()}
         onfocus={() => a_ref?.focus({ preventScroll: true })}
      >
         {image()}

         <Show when={hovering()}>
            <ImagePreviewOverlay
               hovering={hovering}
               always_show={always_show}
               a_ref={a_ref}
               item_y={props.item_y}
               item_x={props.item_x}
               image={image}
               dimensions={dimensions}
               loading={loading}
               appear_ended={appear_ended}
               filename={props.filename}
            />
         </Show>
         {/* <div class={`loading-animation ${loading() ? "active" : ""}`} /> */}
      </div>
   )
}

function ImagePreviewOverlay(props) {
   return (
      <>
         <div
            class={`image-preview-overlay fade-in ${props.always_show() ? "always-show" : ""}`}
         // onblur={() => set_hovering(false)}
         // onfocus={() => set_hovering(true)}
         >
            <a
               class="label"
               ref={props.a_ref}
               style={{ position: "sticky", top: `calc(var(--header-height) - ${props.item_y()}px)`, left: 0 }}
            // href={`/media/${props.id}`}
            >
               {props.filename}
            </a>

            <span
               class="label"
               style={{ position: "sticky", bottom: `${props.item_y()}px`, left: 0 }}
            >
               {props.image()?.naturalWidth ?? props.dimensions().width}x{props.image()?.naturalHeight ?? props.dimensions().height} {props.appear_ended().toString()}
            </span>
         </div>

      </>
   );
}

export default ImagePreview;