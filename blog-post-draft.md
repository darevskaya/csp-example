# Content Security Policy Is Not Just a Header: Blocking Reflected XSS in Practice

This is the first post in a series that explains Content Security Policy through working examples. Written for frontend and web developers — and especially for anyone whose JavaScript has to run inside someone else's site.

My interest in CSP started from a real product problem. I work on a web SDK that gets embedded into other companies' sites.  
The code has to run inside someone else's application, under someone else's security rules, headers, and constraints.

At some point, we got a customer bug: our SDK did not work with their new CSP configuration.

That changed how I thought about CSP.

Before that, it was just a security header. Important, but external to the code. Something configured by a security team or treated as part of the infrastructure.

But when your JavaScript has to run inside a customer's site, CSP becomes part of the environment your code must be designed for. It affects script loading, inline execution, dynamic code creation, eval, new Function, runtime configuration, and third-party dependencies.

So I no longer think of CSP as "just a header."

I think of it as a browser-enforced contract:

> This page is only allowed to load resources and execute code in specific ways.

I want to start with the simplest case. It shows the core mechanic clearly, before things get complicated. Later posts will look at scenarios where CSP affects how the code itself has to be written — not just what the server sends.

## A vulnerable search page

Let's look at a simple Express route. It takes a search query from the URL and reflects it directly into the HTML response.

```js
import express from "express";

const app = express();

app.get("/search", (req, res) => {
  const query = req.query.term ?? "";

  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>Search</title>
      </head>
      <body>
        <h1>Search results</h1>
        <p id="status">Page loaded normally.</p>

        <div>
          You searched for: ${query}
        </div>
      </body>
    </html>
  `);
});

app.listen(3000);
```

This code is intentionally unsafe.

The value of `term` comes from the URL and is inserted directly into the HTML response. There is no escaping and no sanitization.

A normal request looks harmless:

```text
/search?term=cats
```

The page shows:

```text
You searched for: cats
```

But the server does not know that `cats` is supposed to be plain text. It places whatever it receives into the HTML.

So if the query contains HTML, the browser parses it as HTML:

```html
<strong>cats</strong>
```

And if the query contains HTML with JavaScript, the browser may execute it. This URL:

```text
/search?term=<script>alert('XSS')</script>
```

(In a real browser, this would be URL-encoded as `/search?term=%3Cscript%3Ealert('XSS')%3C%2Fscript%3E`, but the server decodes it before inserting it into the HTML.)

causes the server to reflect it into the HTML:

```html
<div>
  You searched for: <script>alert('XSS')</script>
</div>
```

The script is not loaded from another domain. It is reflected by our own server into our own HTML response. The browser receives an HTML document from a trusted site, sees a `<script>` tag, and runs it.

This is called reflected XSS [1] — attacker-controlled data injected into a request is executed as code inside a trusted application. The browser runs someone else's JavaScript as if it belonged to your site, in the context of your page. Depending on the application, that script may be able to read page state, send authenticated requests, interact with forms, or access browser storage.

The attack does not come from a bad domain — it comes from our own server. Untrusted data was placed directly into the HTML without being treated as text first. The bug is this line:

```js
You searched for: ${query}
```

The application should have encoded `query` as text before inserting it into the HTML.

## Adding CSP

Now let's add this response header:

```http
Content-Security-Policy: default-src 'self'
```

Content Security Policy is a set of instructions from a website to the browser. These instructions restrict what the page is allowed to load or execute. One of CSP's main use cases is reducing the risk of XSS. [2]

`default-src` is the fallback directive for many resource-loading directives. Since this policy does not define `script-src`, the browser uses `default-src` as the script policy. `'self'` means resources may only be loaded from the page's own origin.

This tells the browser:

> Scripts may only be loaded from this origin, and inline scripts are not allowed.

So this is allowed:

```html
<script src="/app.js"></script>
```

But inline JavaScript is not allowed:

```html
<script>alert('XSS')</script>
```

This distinction matters. `'self'` only controls where script *files* can be loaded from. Inline scripts have no URL — they are just code inside the HTML. With this policy, the browser blocks them by default. Allowing inline execution requires an explicit opt-in: `'unsafe-inline'` (which defeats the protection), a nonce, or a hash — both of which allow specific trusted scripts while keeping injected ones blocked. Those are topics for a later post. [2]

So with this CSP in place, our server may still return unsafe HTML, but the browser refuses to execute the injected inline script.

The bug is still there. The exploit path is blocked.

## What CSP changed

CSP did not inspect the input, sanitize the HTML, or remove the injected `<script>` tag from the response.

The browser still receives the HTML. But when it reaches the inline script, it checks the page's policy and blocks execution.

That is why CSP is useful. It gives the browser a rule to enforce after something has already gone wrong in the application.

In this case, the rule is:

> Inline JavaScript is not allowed on this page.

That rule blocks both malicious inline scripts and legitimate inline scripts. The browser does not know which one you intended. It only enforces the policy.

This is why CSP can be painful when you add it to an existing application. Many apps rely on inline scripts for normal reasons:

```html
<script>
  window.appConfig = {
    apiUrl: "/api"
  };
</script>
```

or:

```html
<button onclick="save()">Save</button>
```

Those patterns are common, but `default-src 'self'` will not allow them. CSP does not care that the code is convenient. It only checks whether the code is allowed by the policy.

## Try it yourself

The scenario above is running as a live demo: **[csp-example.onrender.com/examples/reflected-xss/unsafe](https://csp-example.onrender.com/examples/reflected-xss/unsafe)**

You can toggle CSP on and off and watch the browser console block the injected script when the policy is active. The unsafe route reflects input directly into the page with no CSP set. The CSP-protected route still reflects the input, but it also sets `Content-Security-Policy: default-src 'self'`. The browser receives the same kind of unsafe HTML, but refuses to execute the injected inline script. The console will show exactly what was blocked and why:

```
Executing inline script violates the following Content Security Policy directive
'default-src 'self''. Either the 'unsafe-inline' keyword, a hash, or a nonce is
required to enable inline execution. Note also that 'script-src' was not explicitly
set, so 'default-src' is used as a fallback. The action has been blocked.
```

The source code for the demo is on [GitHub](https://github.com/darevskaya/csp-example).

## CSP is not the fix for XSS

CSP should not be the only thing protecting this page.

The real fix is to stop inserting raw user input into HTML. The application should escape the value before rendering it, so this:

```html
<script>alert("xss")</script>
```

is shown as text:

```html
&lt;script&gt;alert("xss")&lt;/script&gt;
```

and not interpreted as HTML.

OWASP recommends output encoding when you want to display data as the user typed it, so variables are treated as text instead of code. [3]

CSP is a second layer. It helps when something was missed — an unsafe template, a dangerous `innerHTML`, a legacy page, a dependency pattern you did not notice, or an edge case in a migration. It does not remove the bug, but it can reduce what the browser is allowed to execute when the bug is reached.

CSP does not make unsafe rendering safe. It limits what the browser will execute if unsafe rendering happens.

MDN says this directly: setting a CSP is not an alternative to sanitizing input. Sites should sanitize input and set a CSP as defense in depth against XSS. [2]

OWASP describes a strong CSP in the same way: it does not remove vulnerabilities from the application, but it can make them harder to exploit. [4]

## CSP exposes your frontend assumptions

The visible part of CSP is small:

```http
Content-Security-Policy: default-src 'self'
```

But adopting it raises frontend questions:

- Do we have inline scripts?
- Do we use inline event handlers?
- Do we rely on `eval()` or `new Function()`?
- Do our dependencies generate code at runtime?
- Do we load scripts from third-party domains?
- Do we inject runtime configuration into HTML?
- Do our framework and build setup work without unsafe script patterns?

This is why CSP is not just a header and not a security checkbox. A meaningful CSP policy describes how the browser is allowed to run your frontend code. If your application does not follow those rules, the browser will block it.

That makes CSP a contract between your application and the browser.

## Conclusion

The example is simple: user input inserted into HTML without escaping. The bug is still there with CSP — the server still returns the unsafe HTML. But the browser refuses to run the injected script because the policy does not allow inline JavaScript.

CSP does not replace escaping, sanitization, or safe DOM APIs. It adds a browser-enforced layer that limits what can happen when something goes wrong — and it makes your frontend assumptions visible, because the browser has to enforce them.

That is why CSP is not just a header. It is a browser-enforced contract — a rule set that describes what your page is allowed to load and execute, and that the browser will enforce even when something in the application goes wrong.

In future posts, I'll look at more of CSP in practice: directives, nonces and hashes, reporting, and the limits of what CSP can protect against.

## References

[1] [OWASP — Cross Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
[2] [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
[3] [OWASP — Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
[4] [OWASP — Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
