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
   item_screen_y: () => number;
}

const encodeURL = (url) => url.replaceAll("#", "%23");

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

   const transformImage = (() => `translate(${props.item_x()}px, ${props.item_y()}px) scale(${props.item_size() / 1024})`);
   const transform = (() => `translate(${props.item_x()}px, ${props.item_y()}px)`);

   const mipmap = () => props.mipmaps.at(
      mipmap_index()
      // appear_ended()
      //    ? mipmap_index()
      //    : mipmap_index() - 1
   );


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

   const in_screen = () => props.item_screen_y() >= -props.item_size() && props.item_screen_y() < window.innerHeight;

   const src = () => //in_screen()
      encodeURL(mipmap()?.src ?? props.src)
   // : "";

   // const fetch_priority = () => in_screen() ? "high" : "auto";
   // const resource_fetcher = () => ({ src: src(), fetch_priority: "high" })

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

      // if (!_image)
      //    return;

      if (!loading && prev_loading) {
         // const _loaded_before = untrack(loaded_before);

         // _image.className = untrack(appear_animation);
         const should_appear = untrack(should_appear_animation) && !loaded_before
         //  && !_image.cached;
         _image.className = should_appear ? "fade-in" : "";
         // _image.style.setProperty("animation-delay", untrack(props.item_screen_y) + "ms")

         set_appear_ended(!should_appear);

         // _image.style.setProperty("background-color", background_color);

         // if (!untrack(should_appear))
         //    set_appear_ended(true);
         // _image.onanimationend = () => set_appear_ended(true);

         if (props.metadata.size.width < 100 || props.metadata.size.height < 100)
            _image.style.setProperty("image-rendering", "pixelated");
         else
            _image.style.removeProperty("image-rendering");

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

   const background_color = props.metadata.colors
      ? `rgba(${props.metadata.colors.at(0)._rgb.join(",")})`
      : `rgb(125, 0, 255)`;
   // const background_color = `rgb(${props.metadata.palette.DarkMuted.rgb.join(",")})`;

   return (
      <>

         <div
            class={`image-preview ${!should_appear_animation() || appear_ended() ? "" : "fade-in"}`}
            style={{
               transform: transformImage(),
               // "background-color": appear_ended() ? "transparent" : background_color
               "--bg-color": background_color,
               "background-color": !should_appear_animation() || appear_ended() ? "transparent" : background_color,
            }}
            onmouseenter={() => set_hovering(true)}
            onmouseleave={() => set_hovering(false)}
         >
            {image()}
         </div>

         {/* <div
            class={`image-preview`}
            style={{ transform: transformImage(), }}
            onmouseenter={() => set_hovering(true)}
            onmouseleave={() => set_hovering(false)}
         >
            {image()}
         </div> */}

         {/* <Show when={image()} >
            <img
               class={`image-preview ${image()?.className}`}
               src={image()?.src ??
                  // props.mipmaps[0].src.replaceAll("\\", "/")
                  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
               }
               style={{
                  transform: transformImage(),
                  "--item_index": props.item_index,
                  "background-color": background_color,
                  // "background-image": `url("${props.mipmaps[0].src.replaceAll("\\", "/")}")`,
                  "background-size": "cover",
               }}
               onmouseenter={() => set_hovering(true)}
               onmouseout={() => set_hovering(false)}
            />
         </Show> */}

         <Show when={hovering()}>
            <div
               class={`image-preview-container /*fade-in*/`}
               style={{
                  // transform: transform(),
                  // width: props.item_size() + "px",
                  "--item_index": props.item_index,
                  "background-color": "transparent",
                  "pointer-events": "none",
               }}
            // onpointerover={(e) => e.target.releasePointerCapture(e.pointerId)}
            // onmouseout={() => set_hovering(false)}
            // onmouseover={() => set_hovering(true)}
            >

               <div
                  class={`image-preview-overlay ${always_show() ? "always-show" : ""}`}
               // onblur={() => set_hovering(false)}
               // onfocus={() => set_hovering(true)}
               >
                  <a
                     class="label"
                     ref={a_ref}
                  // style={{ position: "absolute", top: 0 }}
                  // style={{ position: "sticky", top: `calc(var(--header-height) - ${props.item_y()}px)`, left: 0 }}
                  // href={`/media/${props.id}`}
                  >
                     {props.filename}
                  </a>

                  <span
                     class="label"
                  // style={{ position: "absolute", bottom: 0 }}
                  // style={{ position: "sticky", bottom: `${props.item_y()}px`, left: 0 }}
                  >
                     {image()?.naturalWidth ?? dimensions().width}x{image()?.naturalHeight ?? dimensions().height}<br />
                     {props.metadata.size.width}x{props.metadata.size.height}<br />
                     {/* {in_screen()} <br /> */}
                     {appear_ended().toString()}
                  </span>
               </div>

               {/* <div class={`loading-animation ${loading() ? "active" : ""}`} /> */}
            </div>
         </Show>
      </>
   )
}

export default ImagePreview;