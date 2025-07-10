---
layout: page
title: 图论学习笔记
permalink: /graph-theory/ # ★★★ 确保这个 URL 是正确的
---

<!-- 下面是遍历图论集合的代码 -->
{%- if site.graph_theory and site.graph_theory.size > 0 -%}
  <p>这里是所有关于“图论”的学习笔记和文章，按照章节顺序排列。</p>
  <ul class="post-list">
    {%- assign sorted_docs = site.graph_theory | sort: 'path' -%}
    {%- for doc in sorted_docs -%}
    <li>
      <h3>
        <a class="post-link" href="{{ doc.url | relative_url }}">
          {{ doc.title | escape }}
        </a>
      </h3>
    </li>
    {%- endfor -%}
  </ul>
{%- else -%}
  <p>此部分暂无内容。</p>
{%- endif -%}