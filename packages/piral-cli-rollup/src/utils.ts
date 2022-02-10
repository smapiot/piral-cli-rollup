import { load, Element, CheerioAPI } from 'cheerio';
import { readFileSync } from 'fs';
import { basename, dirname, extname, resolve } from 'path';

function isLocal(path: string) {
  if (path) {
    if (path.startsWith(':')) {
      return false;
    } else if (path.startsWith('http:')) {
      return false;
    } else if (path.startsWith('https:')) {
      return false;
    } else if (path.startsWith('data:')) {
      return false;
    }

    return true;
  }

  return false;
}

function getName(path: string) {
  const name = filename(path);

  if (/\.(jsx?|tsx?)$/.test(path) && name === 'index') {
    return 'main';
  } else {
    return name;
  }
}

function filename(path: string) {
  const file = basename(path);
  const ext = extname(file);
  return file.substring(0, file.length - ext.length);
}

function extractParts(content: CheerioAPI) {
  const sheets = content('link[href][rel=stylesheet]')
    .filter((_, e: Element) => isLocal(e.attribs.href))
    .remove()
    .toArray() as Array<Element>;
  const scripts = content('script[src]')
    .filter((_, e: Element) => isLocal(e.attribs.src))
    .remove()
    .toArray() as Array<Element>;
  const files = [];

  for (const script of scripts) {
    files.push(script.attribs.src);
  }

  for (const sheet of sheets) {
    files.push(sheet.attribs.href);
  }

  return files;
}

export function getVariables(): Record<string, string> {
  return Object.keys(process.env).reduce(
    (prev, curr) => {
      prev[`process.env.${curr}`] = JSON.stringify(process.env[curr]);
      return prev;
    },
    {
      'process.env.DEBUG_PIRAL': '""',
      'process.env.DEBUG_PILET': '""',
    },
  );
}

export function makeHtmlAttributes(attributes: Record<string, any>) {
  if (attributes) {
    const keys = Object.keys(attributes);
    // eslint-disable-next-line no-param-reassign
    return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
  }

  return '';
}

export function inspectHtml(rootDir: string, htmlFile: string) {
  const template = resolve(rootDir, htmlFile);
  const src = dirname(template);
  const templateContent = load(readFileSync(template, 'utf8'));
  const newEntries = extractParts(templateContent).map((entry) => resolve(src, entry));
  templateContent('*')
    .contents()
    .filter((_, m) => m.type === 'text')
    .each((_, m: any) => {
      m.nodeValue = m.nodeValue.replace(/\s+/g, ' ');
    });

  return {
    template: templateContent,
    entries: newEntries,
  };
}
