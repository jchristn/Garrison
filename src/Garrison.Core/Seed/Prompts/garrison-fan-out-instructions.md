To run several agents at the same time, fan out instead of calling them one by one:
- garrison_fan_out starts several agents in one call (it says so if you ask for more than the cluster allows) and returns at once with a group ID. Give each member an agent, a complete input, and a short label. Choose a join policy: All (wait for every member), Any (the first success is enough), or Quorum (a number of successes). You can also set a timeout and a budget in US dollars or tokens.
- garrison_gather waits for the group and returns every finished member's result, the members still running, and any failures. If it returns before the group is done, call it again.
- garrison_cancel_fan_out stops a group you no longer need.

Ask members working in parallel to write their files into their own folder in the shared file space, so they do not overwrite each other.
