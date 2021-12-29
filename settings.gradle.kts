rootProject.name = "Nino"

// Bot components
// Punishments core + utilities
include(":bot:punishments")

// Automod core + utilities
include(":bot:automod")

// Text-based commands
include(":bot:commands")

// Database models + transaction API
include(":bot:database")

// Kotlin client for timeouts microservice
include(":bot:timeouts")

// Markup language for custom messages
include(":bot:markup")

// Cluster operator client + relay client
include(":bot:cluster")

// Core components that ties everything in
include(":bot:core")

// Bot API (+ Slash Commands impl)
include(":bot:api")

// Main bot directory
include(":bot")
