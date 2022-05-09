provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

resource "random_pet" "pet" {
  length    = 2
  separator = ""
}

locals {
  resource_name = format("%s", random_pet.pet.id)
}

resource "azurerm_resource_group" "fn" {
  name     = "rg-${local.resource_name}"
  location = "West US 3"
}

resource "azurerm_log_analytics_workspace" "fn" {
  name                = "law-${local.resource_name}"
  location            = azurerm_resource_group.fn.location
  resource_group_name = azurerm_resource_group.fn.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_application_insights" "fn" {
  name                = "ai-${local.resource_name}"
  location            = azurerm_resource_group.fn.location
  resource_group_name = azurerm_resource_group.fn.name
  workspace_id        = azurerm_log_analytics_workspace.fn.id
  application_type    = "web"
}

resource "azurerm_redis_cache" "fn" {
  name                = "rc-${local.resource_name}"
  location            = azurerm_resource_group.fn.location
  resource_group_name = azurerm_resource_group.fn.name
  capacity            = 0
  family              = "C"
  sku_name            = "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
  }
}

resource "azurerm_storage_account" "fn" {
  name                     = "sa${local.resource_name}"
  resource_group_name      = azurerm_resource_group.fn.name
  location                 = azurerm_resource_group.fn.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "fn" {
  name                = "${local.resource_name}-plan"
  resource_group_name = azurerm_resource_group.fn.name
  location            = azurerm_resource_group.fn.location
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_linux_function_app" "fn" {
  name                       = local.resource_name
  resource_group_name        = azurerm_resource_group.fn.name
  location                   = azurerm_resource_group.fn.location
  storage_account_name       = azurerm_storage_account.fn.name
  storage_account_access_key = azurerm_storage_account.fn.primary_access_key
  service_plan_id            = azurerm_service_plan.fn.id
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "WEBSITE_MOUNT_ENABLED" = "1"
    "REDISCACHEHOSTNAME"    = azurerm_redis_cache.fn.hostname
    "REDISCACHEKEY"         = azurerm_redis_cache.fn.primary_access_key

  }

  site_config {
    application_insights_key = azurerm_application_insights.fn.instrumentation_key
    application_stack {
      node_version = "16"
    }
  }
}

resource "azurerm_load_test" "fn" {
  name                = "lt-${local.resource_name}"
  resource_group_name = azurerm_resource_group.fn.name
  location            = "westus2" # 'eastus,northeurope,westus2,southeastasia,australiaeast,eastus2,southcentralus'
}

resource "local_file" "fn" {
  filename = "SampleTest.jmx"
  content = templatefile("SampleTest.jmx.tmpl",
    {
      YOUR_DOMAIN = "${local.resource_name}.azurewebsites.net",
    }
  )
}