namespace Garrison.Core.Services
{
    using System;
    using System.Linq;
    using Garrison.Core.Models;

    /// <summary>
    /// Fills prompt roles a deployment leaves unbound with the built-in templates (System, Task, DelegatedTask),
    /// following the current version, so every run is compiled from templates (D-021). Explicit bindings are kept.
    /// Thread-safe.
    /// </summary>
    public static class DefaultPromptBindings
    {
        /// <summary>
        /// Add default bindings for missing roles.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <exception cref="ArgumentNullException">Thrown when deployment is null.</exception>
        public static void Apply(Deployment deployment)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            Add(deployment, "System", "default-system");
            Add(deployment, "Task", "default-task");
            Add(deployment, "DelegatedTask", "delegated-task");
        }

        private static void Add(Deployment deployment, string role, string key)
        {
            if (deployment.PromptBindings.Any(b => String.Equals(b.Role, role, StringComparison.OrdinalIgnoreCase))) return;
            DeploymentPromptBinding binding = new DeploymentPromptBinding();
            binding.Role = role;
            binding.TemplateId = BuiltInSeeder.PromptId(key);
            deployment.PromptBindings.Add(binding);
        }
    }
}
