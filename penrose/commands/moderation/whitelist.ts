import { Command } from "../../classes/core/command-handler";
import { ChatSendBeforeEvent, world } from "@minecraft/server";
import { whitelistDB } from "../../event-listeners/world-initialize";

/**
 * Defines the whitelist command for managing server access.
 */
export const whitelistCommand: Command = {
    name: "whitelist",
    description: "Manage the whitelist by adding or removing a player, or list all whitelisted players.",
    usage: "{prefix}whitelist <add|remove|list> <player>",
    examples: [`{prefix}whitelist add Steve`, `{prefix}whitelist remove Steve`, `{prefix}whitelist list`],
    category: "Moderation",
    securityClearance: 3,
    icon: "textures/ui/multiplayer_glyph_color.png",
    guiInstructions: {
        formType: "ActionFormData",
        title: "Whitelist Management",
        description:
            "Manage the server whitelist.\n\n" + "7 Add a player to grant them access.\n" + "7 Remove a player to revoke access.\n" + "7 List all whitelisted players currently on the server.\n" + "7 Player names are case-sensitive.\n\n",
        commandOrder: "command-arg",
        actions: [
            {
                name: "Add Player",
                securityClearance: 4,
                description: "Add a player to the whitelist.",
                icon: "textures/ui/FriendsDiversity.png",
                generateSubActions: true,
                subActions: [
                    {
                        name: "Add Online Player",
                        command: ["add"],
                        requiredFields: ["playerNameOnline"],
                        icon: "textures/ui/player_online_icon.png",
                        securityClearance: 4,
                        generateModalForm: true,
                    },
                    {
                        name: "Add Offline Player",
                        command: ["add"],
                        requiredFields: ["playerNameOffline"],
                        icon: "textures/ui/player_offline_icon.png",
                        securityClearance: 4,
                        generateModalForm: true,
                    },
                ],
            },
            {
                name: "Remove Player",
                securityClearance: 4,
                description: "Remove a player from the whitelist.",
                icon: "textures/ui/friend_glyph_desaturated.png",
                generateSubActions: true,
                subActions: [
                    {
                        name: "Remove Online Player",
                        command: ["remove"],
                        requiredFields: ["playerNameOnline"],
                        icon: "textures/ui/player_online_icon.png",
                        securityClearance: 4,
                        generateModalForm: true,
                    },
                    {
                        name: "Remove Offline Player",
                        command: ["remove"],
                        requiredFields: ["playerNameOffline"],
                        icon: "textures/ui/player_offline_icon.png",
                        securityClearance: 4,
                        generateModalForm: true,
                    },
                ],
            },
            {
                name: "List Whitelisted Players",
                securityClearance: 3,
                command: ["list"],
                description: "View all players currently on the whitelist.",
                icon: "textures/ui/multiselection.png",
            },
        ],
        dynamicFields: [
            {
                name: "\nSelect Online Player:",
                type: "dropdown",
                sourceType: "players",
                placeholder: "Choose a player",
                requiredFields: ["playerNameOnline"],
            },
            {
                name: "\nEnter Player Name:",
                type: "text",
                placeholder: "Case Sensitive",
                requiredFields: ["playerNameOffline"],
            },
        ],
    },

    execute: async (message?: ChatSendBeforeEvent, args: string[] = []): Promise<void> => {
        if (!message) return;
        const action = args.shift()?.toLowerCase();
        if (!["add", "remove", "list"].includes(action as string)) {
            message.sender.sendMessage("oc[Paradox] Invalid action. Use `add`, `remove`, or `list`.");
            return;
        }

        const whitelist = (await whitelistDB.get("players")) ?? {};

        if (action === "list") {
            const playerNames = Object.keys(whitelist);
            if (playerNames.length === 0) {
                message.sender.sendMessage("2[7Paradox2]o7 No players are currently whitelisted.");
            } else {
                message.sender.sendMessage("2[7Paradox2]o7 Whitelisted Players:");
                playerNames.forEach((name) => {
                    const record = whitelist[name];
                    if (record) {
                        message.sender.sendMessage(` o7| [f${name}7] (ID: ${record.id})`);
                    }
                });
            }
            return;
        }

        const playerName = args.join(" ").trim().replace(/["@]/g, "");
        if (!playerName) {
            message.sender.sendMessage("oc[Paradox] Please provide a valid player name.");
            return;
        }

        if (action === "add") {
            if (playerName in whitelist) {
                message.sender.sendMessage(`oc[Paradox] Player "${playerName}c" is already in the whitelist.`);
                return;
            }

            const targetPlayer = world.getPlayers({ name: playerName })[0];
            const playerId = targetPlayer ? targetPlayer.id : "Offline";

            whitelist[playerName] = { id: playerId };
            await whitelistDB.set("players", whitelist);
            message.sender.sendMessage(`2[7Paradox2]o7 Player "${playerName}7" has been added to the whitelist.`);
        }

        if (action === "remove") {
            if (!(playerName in whitelist)) {
                message.sender.sendMessage(`oc[Paradox] Player "${playerName}c" is not in the whitelist.`);
                return;
            }

            delete whitelist[playerName];
            await whitelistDB.set("players", whitelist);
            message.sender.sendMessage(`2[7Paradox2]o7 Player "${playerName}7" has been removed from the whitelist.`);
        }
    },
};
