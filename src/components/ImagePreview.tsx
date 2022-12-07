import { createEffect, createMemo, createRenderEffect, createResource, createSignal, onCleanup, Show, Suspense, untrack } from "solid-js";
import { getImage, cancelImage } from "../controllers/imageLoader";

const ImagePreview = (props) => {
   let a_ref;

   const [mipmap_index, set_mipmap_index] = createSignal(0);
   const [hovering, set_hovering] = createSignal(false);
   const [loading, set_loading] = createSignal(false);

   const alway_show = () => props.cols() == 1;
   const transform = (() => `translate(${props.item_x()}px, ${props.item_y()}px)`);

   const mipmap = () => props.mipmaps.at(mipmap_index());

   const src = () => !props.mipmaps.length
      ? props.src
      : mipmap().src

   const dimensions = () => !props.mipmaps.length
      ? { width: 1080, height: 1080 }
      : { width: mipmap().width, height: mipmap().height }

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

   const [image] = createResource<HTMLImageElement>(src, getImage);

   createEffect(() => {
      const item_size = props.item_size();
      let new_mipmap_index = props.mipmaps.findIndex(({ width, height }) => width >= item_size && height >= item_size);
      set_mipmap_index(new_mipmap_index);
   });

   let loaded_before = false;
   createRenderEffect(() => {
      // image.loading && console.log("loading...", src());
      image.error && console.log("error!", src());
      setTimeout(() => set_loading(image.loading))

      if (!image.loading) {
         image().className = image().cached || loaded_before
            ? ""
            : alway_show() ? "fade-in" : "scale-fade-in"

         if (image().naturalWidth * 0.5 < props.item_size() || image().naturalHeight * 0.5 < props.item_size())
            image().style.setProperty("image-rendering", "pixelated");
         else
            image().style.removeProperty("image-rendering");

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
         onfocus={() => a_ref.focus({ preventScroll: true })}
      >
         <div
            class={`${!alway_show() ? "fade-in" : ""} image-preview`}
         >
            {image.error && "error!"}
         </div>

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
               {props.filename.split("__BS__").at(-1)}
            </a>

            <span
               class="label"
               style={{ position: "sticky", bottom: `${props.item_y()}px`, left: 0 }}
            >
               {dimensions().width}x{dimensions().height}
            </span>
         </div>

         <div class={`loading-animation ${loading() ? "active" : ""}`} />
      </div>
   )
}

export default ImagePreview;