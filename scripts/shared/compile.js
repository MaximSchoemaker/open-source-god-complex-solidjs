import fs from 'fs';
import PATH from 'path';

import Crawl, { checkProfile } from "./crawl.js";
import Import from "./import.js";
import { ask, formatBytes, exists, ensureDir } from "./utils.js";

export default async function Compile(actions, path, profile, options, should_ask, should_log) {

   const items = await getItems(path, profile, options, should_log);
   if (!items.length) {
      console.log("no items!");
      return;
   }

   if ((should_ask === true || should_ask?.compile === true)
      && await ask("compile? y/n: ") != "y")
      return

   const actionQueue = await getActionQueue(items, actions, should_log);
   if (!actionQueue.length) {
      console.log("no actions!");
      return;
   }

   if ((should_ask === true || should_ask?.run === true)
      && await ask("run actions? y/n: ") != "y")
      return;

   const compiled_items = await Import(actionQueue);

   if ((should_log || should_log?.summary)
      && compiled_items) {
      const succeeded_items = compiled_items.filter(item => !item.error);
      const failed_items = compiled_items.filter(item => item.error);
      failed_items.map(item => console.log(item));
      console.log("failed:", { items: failed_items.length });

      const totalSize = succeeded_items.reduce((tot, i) => tot + i.metadata.size, 0);
      console.log("succeeded:", { items: succeeded_items.length, size: formatBytes(totalSize) });
   }

   return compiled_items;
}

async function getItems(path, profile, options, should_log) {
   console.log("getting items...");
   const items = await Crawl(path, profile, options);

   if (should_log === true || should_log?.each)
      items.forEach(i => console.log(`${formatBytes(i.metadata.size)} - ${i.filename_with_extension}`));

   if (should_log === true || should_log?.summary) {
      const totalSize = items.reduce((tot, i) => tot + i.metadata.size, 0);
      console.log({ items: items.length, size: formatBytes(totalSize) });
   }

   return items;
}

async function getActionQueue(items, profileActions, should_log) {
   console.log("getting action queue...");
   const actionQueue = [];

   for (const item of items) {

      const actions = profileActions
         .filter(a => checkProfile(item, a.profile))
         .map(({ action }) => action);

      for (const action of actions) {

         const { get_target_path } = action;
         const target_path = get_target_path(item);

         if (!await needsCompiling(item, action, target_path, should_log))
            continue;

         actionQueue.push({ item, target_path, action });
      }
   }

   if (should_log === true || should_log?.summary) {
      const totalSize = actionQueue.reduce((tot, { item }) => tot + item.metadata.size, 0);
      console.log({ actions: actionQueue.length, size: formatBytes(totalSize) });
   }
   return actionQueue;
}


async function needsCompiling(item, action, target_path, should_log) {
   const { override } = action;
   const { metadata: { mtime, size } } = item;

   if (size == 0) {
      console.log(`! source corrupted: ${item.path}`)
      return false;
   }

   let target_metadata =
      await exists(target_path) &&
      await fs.promises.lstat(target_path);

   const needsCompiling = override
      || !target_metadata
      || target_metadata.size == 0
      || target_metadata.mtime < mtime;

   if (!needsCompiling)
      return false;

   if (should_log === true || should_log?.each === true) {
      console.log(`${formatBytes(size)} - ${item.filename_with_extension}`)
      console.log(`   > ${target_metadata ? formatBytes(target_metadata.size) : "X"} - ${PATH.basename(target_path)}`)
   }
   return true;
}