# module sh.nino.discord.markup
> Markup language for constructing mod log and logging outputs.

## Usage
There is two ways to create clean and precise outputs for customizibility.

There is the simple approach, this is where you don't need anything complex, and want to use generic Mustache templates:

```
embed {
    title = "Case {{ .CaseId }} | {{ .Victim | ToUserString }}"
    
    {{- if (.Reason != nil) }}
    description = "{{ .Reason | PreserveMarkdown }}"
    {{- end }}
}
```

And there is the "programmer" approach, where you have a bunch of standard library functions to use:

```
case = context.getCase();
language = context.getCurrentLanguage();

create embed with {
    title("Case $(case.id) | ${case.victim |> ToUserString} (${case.victim.id})") // => Case #1 | August#5820 (280158289667555328)
    check if case.meta.reason is not nil {
        description(case.meta.reason)
    } or else {
        description("owo.da.uwu" |> language.translate) // Use Nino's localization to customize this output.
    }
}
```

### With Kotlin
```kotlin
fun main(args: Array<String>) {
    val markup = MarkupLanguage {
        complexityType = ComplexityType.ROBUST
    }
    
    val context = markup.createContext(mapOf(
        "case" to MyCase(),
        "currentLanguage" to SomeLanguage()
    ))
    
    val node = markup.parse("""
        case = context.getCase();
        language = context.getCurrentLanguage();
        
        create embed with {
            title("Case $(case.id) | \$\{case.victim |> ToUserString} (\$\{case.victim.id})") // => Case #1 | August#5820 (280158289667555328)
            check if case.meta.reason is not nil {
                description(case.meta.reason)
            } or else {
                description("owo.da.uwu" |> language.translate) // Use Nino's localization to customize this output.
            }
        }
    """, withContext = context)
    
    node.errors // => List<MarkupError>
    node.result // => EmbedDocument?
    node.result?.toKordEmbed() // => EmbedBuilder
}
```

## Compile
To compile the Rust project to bring in the bindings, you can call the `compileRust` task:

```sh
$ ./gradlew :bot:markup:compileRust
```
