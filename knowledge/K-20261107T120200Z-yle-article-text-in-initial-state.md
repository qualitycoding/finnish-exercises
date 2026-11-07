---
id: K-20261107T120200Z-yle-article-text-in-initial-state
statement: A Yle article page fetched with curl carries the full article text as JSON in window.__INITIAL__STATE__ (content items of type text and heading, plus datePublished), which is easier to read than the HTML.
status: current
supersedes: []
tags: [subject:finnish-exercises, domain:finnish-current-affairs, phase:implementation, kind:tooling]
applies_to_version: yle.fi as of 2026-11-07
source: { url: "https://yle.fi/a/74-20255222", doi: "", title: "Yle article page source", locator: "ukko-initial-state script", accessed: "2026-11-07", tier: 1 }
confidence: verified
derived_from: []
discovered_by: implementer
run: impl-20261106T235415Z-finnish-current-affairs-exercises
recorded_at: 2026-11-07T12:02:00Z
---
Parse the JSON after window.__INITIAL__STATE__= and walk it for the object whose id matches the article; its content list holds the paragraphs. The page markup may change, so check the result against the page title.
