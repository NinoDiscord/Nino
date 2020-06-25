import { User, EmbedOptions } from 'eris';

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

export enum Module {
  Moderation = 'Moderation',
  Generic = 'Generic',
  System = 'System Administration'
}

export function unembedify(embed: EmbedOptions) {
  let text = '';

  function getTime(now: number) {
    const date = new Date(now);
    const escape = (value) => `0${value}`.slice(-2);
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()} at ${escape(date.getHours())}:${escape(date.getMinutes())}:${escape(date.getSeconds())}${ampm}`;
  }

  if (embed.title) text += `__**${embed.title}**__`;
  if (embed.description) text += `\n${embed.description.includes('> ') ? embed.description : `> **${embed.description}**`}`;
  if (embed.fields) {
    text += '\n';
    for (const field of embed.fields) text += `\n- ${field.name}: ${field.value}`;
  }
  if (embed.footer) {
    let field = `\n\n**${embed.footer.text}`;

    if (embed.timestamp) {
      const time = embed.timestamp instanceof Date ? getTime(embed.timestamp.getTime()) : embed.timestamp;
      field += `at ${time}`;
    }

    text += `${field}**`;
  }

  return text;
}