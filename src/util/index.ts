import { User } from 'eris';

export function humanize(ms: number, long: boolean = false) {
  const weeks = Math.floor(ms / 1000 / 60 / 60 / 24 / 7);
  ms -= weeks * 1000 * 60 * 60 * 24 * 7;

  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  ms -= days * 1000 * 60 * 60 * 24;

  const hours = Math.floor(ms / 1000 / 60 / 60);
  ms -= hours * 1000 * 60 * 60;

  const mins = Math.floor(ms / 1000 / 60);
  ms -= mins * 1000 * 60;

  const sec = Math.floor(ms / 1000);

  let humanized = '';
  if (long) {
    if (weeks > 0) humanized += `${weeks} weeks, `;
    if (days > 0) humanized += `${days} days, `;
    if (hours > 0) humanized += `${hours} hours, `;
    if (mins > 0) humanized += `${mins} minutes, `;
    if (sec > 0) humanized += `${sec} seconds`;
  } else {
    if (weeks > 0) humanized += `${weeks}w`;
    if (days > 0) humanized += `${days}d`;
    if (hours > 0) humanized += `${hours}h`;
    if (mins > 0) humanized += `${mins}m`;
    if (sec > 0) humanized += `${sec}s`;
  }

  return humanized;
}

// TODO: Add more content
export function replaceMessage(text: string, user: User) {
  return text
    .replace(/%author%/, `${user.username}#${user.discriminator}`)
    .replace(/%author.mention%/, user.mention);
}

export function formatSize(bytes: number) {
  const kilo = bytes / 1024;
  const mega = kilo / 1024;
  const giga = mega / 1024;

  if (kilo < 1024) return `${kilo.toFixed(1)}KB`;
  else if (kilo > 1024 && mega < 1024) return `${mega.toFixed(1)}MB`;
  else return `${giga.toFixed(1)}GB`; 
}