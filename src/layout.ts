const isDev = process.env.NODE_ENV !== 'production';

const devScript = isDev ? `\n  <script src="/javascripts/reload.js"></script>` : '';

export function layout(title: string, body: string, extraHeaders = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — CSP Examples</title>
  <link rel="stylesheet" href="/stylesheets/style.css">
  ${extraHeaders}
</head>
<body>
  <header>
    <a class="logo" href="/">csp<span>.</span>examples</a>
    <nav>
      <a href="/">Examples</a>
    </nav>
  </header>
  <main>${body}</main>
  ${devScript}
</body>
</html>`;
}
