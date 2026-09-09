import {type BlogEntry,normalizeSlug,formatDate,readingTimeFromBody} from './queries';
import {renderPreview} from '../markdown/preview';
export function blogItems(posts: BlogEntry[]) {
  return Promise.all(posts.map(async entry=>{
    const {html:summaryHtml,text:summaryText}=await renderPreview(entry.data.summary,entry.body);
    return {title:entry.data.title,slug:normalizeSlug(entry),summaryText,summaryHtml,
      dateLabel:formatDate(entry.data.date),dateISO:entry.data.date.toISOString(),year:String(entry.data.date.getFullYear()),
      tags:entry.data.tags,categories:entry.data.categories.length ? entry.data.categories : entry.data.category ? [entry.data.category] : [],
      collection:entry.data.collection,readingTime:entry.data.reading_time ?? readingTimeFromBody(entry.body),cover:entry.data.cover};
  }));
}
