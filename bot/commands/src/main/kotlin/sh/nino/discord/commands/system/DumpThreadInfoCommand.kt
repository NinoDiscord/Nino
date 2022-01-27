/*
 * Copyright (c) 2019-2022 Nino
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package sh.nino.discord.commands.system

import dev.kord.rest.NamedFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.Clock
import org.apache.commons.lang3.time.StopWatch
import sh.nino.discord.commands.AbstractCommand
import sh.nino.discord.commands.CommandCategory
import sh.nino.discord.commands.CommandMessage
import sh.nino.discord.commands.annotations.Command
import sh.nino.discord.common.extensions.humanize
import java.io.ByteArrayInputStream
import java.lang.management.ManagementFactory
import java.util.concurrent.TimeUnit

@Command(
    "threads",
    "Shows the thread information within the bot so far",
    aliases = ["dump.threads", "dump"],
    ownerOnly = true,
    category = CommandCategory.SYSTEM
)
class DumpThreadInfoCommand: AbstractCommand() {
    override suspend fun execute(msg: CommandMessage) {
        val message = msg.reply("Now collecting thread information, this might take a while...")
        val watch = StopWatch.createStarted()

        val builder = StringBuilder()
        val mxBean = ManagementFactory.getThreadMXBean()
        val infos = mxBean.getThreadInfo(mxBean.allThreadIds)

        builder.appendLine("-- Thread dump created by ${msg.author.tag} (${msg.author.id}) at ${Clock.System.now()} --")
        builder.appendLine()

        for (info in infos) {
            builder.appendLine("[ Thread ${info.threadName} (#${info.threadId}) - ${info.threadState} ]")
            if (mxBean.isThreadCpuTimeSupported) {
                val actualCpuTime = TimeUnit.MILLISECONDS.convert(mxBean.getThreadCpuTime(info.threadId), TimeUnit.NANOSECONDS)
                builder.appendLine("• CPU Time: ${actualCpuTime.humanize(long = true, includeMs = true)}")
            }

            builder.appendLine("• User Time: ${TimeUnit.MILLISECONDS.convert(mxBean.getThreadUserTime(info.threadId), TimeUnit.NANOSECONDS).humanize(long = true, includeMs = true)}")
            builder.appendLine()

            if (info.stackTrace.isEmpty()) {
                builder.appendLine("-- Stacktrace is not available! --")
            } else {
                val stacktrace = info.stackTrace
                for (element in stacktrace) {
                    builder.append("\n    at ")
                    builder.append(element)
                }
            }

            builder.append("\n\n")
        }

        message.delete()

        val stream = withContext(Dispatchers.IO) {
            ByteArrayInputStream(builder.toString().toByteArray(Charsets.UTF_8))
        }

        val file = NamedFile("thread_dump.txt", stream)
        watch.stop()

        msg.replyFile(
            buildString {
                appendLine(
                    ":thumbsup: I have collected the thread information for you! It only took **${watch.getTime(
                        TimeUnit.MILLISECONDS
                    )}**ms to calculate!"
                )

                appendLine(":eyes: You can inspect it in the file I created for you, say thanks after, please? :3")
                appendLine(":pencil: There is currently **${mxBean.threadCount}** threads in this current Java Virtual Machine, only ${mxBean.daemonThreadCount} are background threads.")
            },
            listOf(file)
        )
    }
}
