import { formatSize, Module } from '../../util';
import { injectable, inject } from 'inversify';
import { stripIndents } from 'common-tags';
import { TYPES } from '../../types';
import Command from '../../structures/Command';
import Context from '../../structures/Context';
import Bot from '../../structures/Bot';
import v8 from 'v8';
import { createEmptyEmbed } from '../../util/EmbedUtils';

@injectable()
export default class ProfilerCommand extends Command {
  constructor(@inject(TYPES.Bot) bot: Bot) {
    super(bot, {
      name: 'profiler',
      description: 'Grabs heap statistics from v8',
      aliases: ['v8', 'memory', 'heap'],
      category: Module.System,
      ownerOnly: true,
      hidden: true
    });
  }

  async run(ctx: Context) {
    const stats = v8.getHeapStatistics();
    const embed = createEmptyEmbed()
      .setTitle('[ v8 Statistics ]')
      .setDescription(stripIndents`
        \`\`\`apache
          Allocated Memory: ${formatSize(stats.malloced_memory)} 
          Heap Size Limit : ${formatSize(stats.heap_size_limit)}
          Used Heap Size  : ${formatSize(stats.used_heap_size)}/${formatSize(stats.total_heap_size)}
          Physical Size   : ${formatSize(stats.total_physical_size)}
        \`\`\`
      `)
      .setFooter('v8 is the runtime engine Node.js uses, so this is basic "memory" statistics of the heap v8 caches');

    return ctx.embed(embed);
  }
}
