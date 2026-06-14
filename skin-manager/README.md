# Skin Manager

A web interface for managing your osu! skins without editing JSON files directly.

## Features

- **View all skins** in a clean, card-based layout
- **Add new skins** through a user-friendly form
- **Edit existing skins** with all fields pre-populated
- **Delete skins** with confirmation
- **Real-time updates** to your `docs/items.json` file

## How to Use

1. **Start the server:**
   ```bash
   cd skin-manager
   npm install
   npm start
   ```

2. **Open the interface:**
   Navigate to `http://localhost:3000` in your browser

3. **Manage your skins:**
   - Click "+ Add New Skin" to create a new skin entry
   - Click "Edit" on any skin card to modify it
   - Click "Delete" to remove a skin (with confirmation)

## Form Fields

- **ID**: Unique identifier for the skin (e.g., `my-skin-name`)
- **Title**: Display name of the skin
- **Version**: `lazer`, `both`, or `stable`
- **Type**: `skin`, `layout`, or `tool`
- **Description**: Short description
- **Long Description**: Detailed description (optional)
- **Tags**: Comma-separated tags (e.g., `clean, HUD, modern`)
- **Download Link**: URL to the .osk file
- **Button Text**: Text for the download button (default: "Download")
- **Image**: Single image filename (optional)
- **Images**: JSON array for multiple images (optional)

## Notes

- The interface reads from and writes to `../docs/items.json`
- Changes are saved immediately to the JSON file
- The server must be running to use the interface
- Keep the server running while making changes

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.
