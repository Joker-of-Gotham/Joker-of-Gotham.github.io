import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage exposes concise real navigation and six scene stops", async({page})=>{
  await page.goto("/");
  await expect(page.locator("[data-observatory-chapter]")).toHaveCount(6);
  await expect(page.locator("h1")).toHaveText("Chika Komari");
  await expect(page.locator(".observatory-chapter-frame")).toHaveCount(6);
  await expect(page.locator(".observatory-nav-shell").getByRole("link",{name:"博客",exact:true})).toHaveAttribute("href","/blog/");
  await expect(page.locator(".observatory-character-layer, .observatory-supplement")).toHaveCount(0);
});

test("theme persists across homepage and article navigation",async({page})=>{
  await page.emulateMedia({colorScheme:"dark"});
  await page.goto("/");
  await page.locator("[data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await page.locator(".home-site-nav").getByRole("link",{name:"博客",exact:true}).click();
  await expect(page).toHaveURL(/\/blog\//);
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
});

test("resize and rapid reverse travel retain the same renderer",async({page})=>{
  await page.goto("/");
  const root=page.locator("[data-observatory-root]");
  await expect(root).toHaveAttribute("data-render-state","ready");
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:900});
    await page.locator("#orchestrate").evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:"instant"}));
    await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
  }
  await expect(root).toHaveAttribute("data-active-chapter","signal-gate");
  await expect(root).toHaveAttribute("data-scene-generation","1");
  await expect(root).toHaveAttribute("data-canvas-generation","1");
});

test("native keyboard navigation reaches homepage controls",async({page})=>{
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".observatory-skip-link")).toBeFocused();
});

test("no JavaScript keeps useful navigation and article entries",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage(); await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("#observe .home-entries a")).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test("Save-Data never downloads the Three controller",async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,"connection",{value:{saveData:true},configurable:true}));
  const requests:string[]=[]; page.on("request",r=>requests.push(r.url()));
  await page.goto("/");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-render-state","static");
  expect(requests.some(url=>/\/controller[.-]/.test(url))).toBe(false);
});

for(const theme of ["dark","light"] as const){
  test("homepage automated accessibility: "+theme,async({page})=>{
    await page.emulateMedia({colorScheme:theme,reducedMotion:"reduce"});
    await page.goto("/");
    const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("blog filters disclose on demand and preserve working search",async({page})=>{
  await page.goto("/blog/");
  await expect(page.locator(".blog-filter-grid")).not.toBeVisible();
  await page.locator(".blog-filter-options summary").click();
  await expect(page.locator(".blog-filter-grid")).toBeVisible();
  await page.locator("#blog-query").fill("Lean4");
  await expect(page.locator("[data-blog-item]:visible")).toHaveCount(1);
  await expect(page.locator("[data-blog-item]:visible h3")).toContainText("Lean4");
});
