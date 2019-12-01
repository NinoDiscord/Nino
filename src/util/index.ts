export function humanize(ms: number) {
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
  if (weeks > 0) humanized += `${weeks} weeks, `;
  if (days > 0) humanized += `${days} days, `;
  if (hours > 0) humanized += `${hours} hours, `;
  if (mins > 0) humanized += `${mins} minutes, `;
  if (sec > 0) humanized += `${sec} seconds`;

  return humanized;
}
