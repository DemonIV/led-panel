// ===========================================================================
// LED Panel Manager - After Effects ExtendScript
// Professional After Effects integration for LED Panel Management
// ===========================================================================

// Global variables
var LED_PANEL_VERSION = "1.0.0";
var DEFAULT_FRAMERATE = 30;
var DEFAULT_DURATION = 10;

// ===========================================================================
// MAIN PROJECT CREATION FUNCTIONS
// ===========================================================================

function createSquareMaster(projectName, projectData) {
    try {
        app.beginUndoGroup("Create Square Master Composition");
        
        var compName = (projectName || "LED_Project") + "_Master_1920x1920";
        var comp = app.project.items.addComp(compName, 1920, 1920, 1, DEFAULT_DURATION, DEFAULT_FRAMERATE);
        
        // Add background solid
        var bgSolid = comp.layers.addSolid([0.1, 0.1, 0.1], "Background", 1920, 1920, 1);
        bgSolid.locked = true;
        
        // Add project folder if needed
        var projectFolder = createProjectFolder(projectName || "LED_Project");
        comp.parentFolder = projectFolder;
        
        // Add guide layers
        addGuideLayersToComp(comp);
        
        // Log success
        logAction("create_square_master", {
            composition_name: compName,
            project_name: projectName
        });
        
        app.endUndoGroup();
        return "success: Square master created - " + compName;
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function createCustomMaster(projectName, width, height, assets) {
    try {
        app.beginUndoGroup("Create Custom Master Composition");
        
        var w = parseInt(width) || 1920;
        var h = parseInt(height) || 1080;
        var compName = (projectName || "LED_Project") + "_Master_" + w + "x" + h;
        
        var comp = app.project.items.addComp(compName, w, h, 1, DEFAULT_DURATION, DEFAULT_FRAMERATE);
        
        // Background solid with aspect-aware color
        var bgColor = getBackgroundColorForAspect(w / h);
        var bgSolid = comp.layers.addSolid(bgColor, "Background", w, h, 1);
        bgSolid.locked = true;
        
        // Project folder
        var projectFolder = createProjectFolder(projectName || "LED_Project");
        comp.parentFolder = projectFolder;
        
        // Process assets if provided
        if (assets && assets.length > 0) {
            processAssetsToComposition(comp, assets);
        }
        
        // Add guides
        addGuideLayersToComp(comp, w, h);
        
        logAction("create_custom_master", {
            composition_name: compName,
            width: w,
            height: h,
            project_name: projectName
        });
        
        app.endUndoGroup();
        return "success: Custom master created - " + compName;
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function createCompositionsFromLEDs(ledArray) {
    try {
        app.beginUndoGroup("Create Compositions from LEDs");
        
        if (!ledArray || ledArray.length === 0) {
            return "Error: No LEDs provided";
        }
        
        var createdComps = [];
        var mainFolder = createProjectFolder("LED_Batch_" + new Date().getTime());
        
        for (var i = 0; i < ledArray.length; i++) {
            var led = ledArray[i];
            
            if (!led.enPx || !led.boyPx) {
                continue;
            }
            
            var compName = led.ledKodu + "_" + led.enPx + "x" + led.boyPx;
            var comp = app.project.items.addComp(compName, led.enPx, led.boyPx, 1, DEFAULT_DURATION, DEFAULT_FRAMERATE);
            
            // Background with LED-specific color
            var bgColor = getLEDBackgroundColor(led);
            var bgSolid = comp.layers.addSolid(bgColor, "Background", led.enPx, led.boyPx, 1);
            bgSolid.locked = true;
            
            // Add LED info as text layer
            addLEDInfoLayer(comp, led);
            
            // Add to folder
            comp.parentFolder = mainFolder;
            createdComps.push(compName);
            
            // Progress feedback for large batches
            if (i % 10 === 0) {
                app.project.save();
            }
        }
        
        logAction("create_compositions_from_leds", {
            led_count: ledArray.length,
            created_count: createdComps.length
        });
        
        app.endUndoGroup();
        return "success: Created " + createdComps.length + " compositions";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

// ===========================================================================
// ASSET MANAGEMENT FUNCTIONS
// ===========================================================================

function addAssetToComp(filePath, assetType, assetName) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Asset to Composition");
        
        var importFile = new File(filePath);
        if (!importFile.exists) {
            return "Error: File not found - " + filePath;
        }
        
        // Import asset
        var importedItem = app.project.importFile(new ImportOptions(importFile));
        
        if (!importedItem) {
            return "Error: Failed to import asset";
        }
        
        // Add to composition based on type
        var layer;
        switch (assetType) {
            case "2D_logo":
                layer = comp.layers.add(importedItem);
                layer.name = assetName || "2D Logo";
                // Center and scale appropriately
                layer.transform.position.setValue([comp.width/2, comp.height/2]);
                scaleLayerToFit(layer, comp, 0.8);
                break;
                
            case "3D_shoe":
                layer = comp.layers.add(importedItem);
                layer.name = assetName || "3D Shoe";
                layer.threeDLayer = true;
                layer.transform.position.setValue([comp.width/2, comp.height/2, 0]);
                break;
                
            case "3D_logo":
                layer = comp.layers.add(importedItem);
                layer.name = assetName || "3D Logo";
                layer.threeDLayer = true;
                break;
                
            default:
                layer = comp.layers.add(importedItem);
                layer.name = assetName || "Asset";
        }
        
        logAction("add_asset", {
            asset_type: assetType,
            asset_name: assetName,
            composition_name: comp.name
        });
        
        app.endUndoGroup();
        return "success: Asset added - " + (assetName || assetType);
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function addSolidLayer() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Solid Layer");
        
        var solid = comp.layers.addSolid([1, 1, 1], "Solid", comp.width, comp.height, 1);
        solid.transform.position.setValue([comp.width/2, comp.height/2]);
        
        app.endUndoGroup();
        return "success: Solid layer added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function addShoeAsset() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Shoe Asset");
        
        // Create placeholder for shoe (would be replaced with actual asset import)
        var solid = comp.layers.addSolid([0.2, 0.4, 0.8], "Shoe_Placeholder", comp.width * 0.6, comp.height * 0.4, 1);
        solid.transform.position.setValue([comp.width/2, comp.height/2]);
        
        // Add basic animation
        var position = solid.transform.position;
        position.setValueAtTime(0, [comp.width/2, comp.height/2 + 50]);
        position.setValueAtTime(2, [comp.width/2, comp.height/2]);
        
        app.endUndoGroup();
        return "success: Shoe asset added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function add2DLogoAsset() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add 2D Logo");
        
        var solid = comp.layers.addSolid([1, 0.8, 0], "2D_Logo_Placeholder", comp.width * 0.3, comp.height * 0.15, 1);
        solid.transform.position.setValue([comp.width/2, comp.height * 0.15]);
        
        app.endUndoGroup();
        return "success: 2D Logo added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function add3DLogoAsset() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add 3D Logo");
        
        var solid = comp.layers.addSolid([1, 0.8, 0], "3D_Logo_Placeholder", comp.width * 0.3, comp.height * 0.15, 1);
        solid.transform.position.setValue([comp.width/2, comp.height * 0.15, -100]);
        solid.threeDLayer = true;
        
        // Add camera for 3D
        if (comp.layers.byName("Camera") === null) {
            var camera = comp.layers.addCamera("Camera", [comp.width/2, comp.height/2]);
        }
        
        app.endUndoGroup();
        return "success: 3D Logo added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function add3DShoeAsset() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add 3D Shoe");
        
        var solid = comp.layers.addSolid([0.2, 0.4, 0.8], "3D_Shoe_Placeholder", comp.width * 0.6, comp.height * 0.4, 1);
        solid.transform.position.setValue([comp.width/2, comp.height/2, 0]);
        solid.threeDLayer = true;
        
        // Add rotation animation
        var rotation = solid.transform.rotation;
        rotation.setValueAtTime(0, 0);
        rotation.setValueAtTime(5, 360);
        
        // Add camera
        if (comp.layers.byName("Camera") === null) {
            var camera = comp.layers.addCamera("Camera", [comp.width/2, comp.height/2]);
        }
        
        app.endUndoGroup();
        return "success: 3D Shoe added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function addTextMachine() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Text Machine");
        
        var textLayer = comp.layers.addText("YOUR TEXT HERE");
        var textDocument = textLayer.property("Source Text").value;
        
        textDocument.fontSize = Math.min(comp.width, comp.height) * 0.08;
        textDocument.fillColor = [1, 1, 1];
        textDocument.font = "Arial-BoldMT";
        textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
        textDocument.tracking = 50;
        
        textLayer.property("Source Text").setValue(textDocument);
        textLayer.transform.position.setValue([comp.width/2, comp.height/2]);
        
        // Add basic animation
        var scale = textLayer.transform.scale;
        scale.setValueAtTime(0, [0, 0]);
        scale.setValueAtTime(0.5, [120, 120]);
        scale.setValueAtTime(1, [100, 100]);
        
        app.endUndoGroup();
        return "success: Text machine added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

// ===========================================================================
// TEMPLATE APPLICATION FUNCTIONS
// ===========================================================================

function applyTemplate(templateType, duration) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Apply Template - " + templateType);
        
        var templateDuration = parseFloat(duration) || 3.0;
        
        switch (templateType) {
            case "shoe_in_out":
                applyShoeInOutTemplate(comp, templateDuration);
                break;
            case "logo_intro":
                applyLogoIntroTemplate(comp, templateDuration);
                break;
            case "logo_outro":
                applyLogoOutroTemplate(comp, templateDuration);
                break;
            case "transition":
                applyTransitionTemplate(comp, templateDuration);
                break;
            default:
                return "Error: Unknown template type - " + templateType;
        }
        
        logAction("apply_template", {
            template_type: templateType,
            duration: templateDuration,
            composition_name: comp.name
        });
        
        app.endUndoGroup();
        return "success: Template applied - " + templateType;
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function applyShoeInOutTemplate(comp, duration) {
    // Find shoe layers (or create placeholder)
    var shoeLayers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.name.toLowerCase().indexOf("shoe") !== -1) {
            shoeLayers.push(layer);
        }
    }
    
    if (shoeLayers.length === 0) {
        // Create shoe placeholder
        var shoeLayer = comp.layers.addSolid([0.2, 0.4, 0.8], "Shoe", comp.width * 0.6, comp.height * 0.4, 1);
        shoeLayer.transform.position.setValue([comp.width/2, comp.height/2]);
        shoeLayers.push(shoeLayer);
    }
    
    // Apply shoe animation to all shoe layers
    for (var j = 0; j < shoeLayers.length; j++) {
        var layer = shoeLayers[j];
        
        // Position animation (slide in from right)
        var position = layer.transform.position;
        var startPos = [comp.width + layer.width/2, comp.height/2];
        var endPos = [comp.width/2, comp.height/2];
        
        position.setValueAtTime(0, startPos);
        position.setValueAtTime(duration * 0.3, endPos);
        position.setValueAtTime(duration * 0.7, endPos);
        position.setValueAtTime(duration, [-layer.width/2, comp.height/2]);
        
        // Scale animation
        var scale = layer.transform.scale;
        scale.setValueAtTime(0, [50, 50]);
        scale.setValueAtTime(duration * 0.3, [100, 100]);
        scale.setValueAtTime(duration * 0.7, [100, 100]);
        scale.setValueAtTime(duration, [80, 80]);
        
        // Rotation
        var rotation = layer.transform.rotation;
        rotation.setValueAtTime(0, -45);
        rotation.setValueAtTime(duration * 0.3, 0);
        rotation.setValueAtTime(duration * 0.7, 0);
        rotation.setValueAtTime(duration, 45);
    }
}

function applyLogoIntroTemplate(comp, duration) {
    // Find logo layers
    var logoLayers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.name.toLowerCase().indexOf("logo") !== -1) {
            logoLayers.push(layer);
        }
    }
    
    if (logoLayers.length === 0) {
        // Create logo placeholder
        var logoLayer = comp.layers.addSolid([1, 0.8, 0], "Logo", comp.width * 0.3, comp.height * 0.15, 1);
        logoLayer.transform.position.setValue([comp.width/2, comp.height * 0.15]);
        logoLayers.push(logoLayer);
    }
    
    // Apply intro animation
    for (var j = 0; j < logoLayers.length; j++) {
        var layer = logoLayers[j];
        
        // Scale intro
        var scale = layer.transform.scale;
        scale.setValueAtTime(0, [0, 0]);
        scale.setValueAtTime(duration * 0.4, [120, 120]);
        scale.setValueAtTime(duration * 0.8, [100, 100]);
        
        // Opacity
        var opacity = layer.transform.opacity;
        opacity.setValueAtTime(0, 0);
        opacity.setValueAtTime(duration * 0.3, 100);
        
        // Position (drop down)
        var position = layer.transform.position;
        var finalPos = position.value;
        position.setValueAtTime(0, [finalPos[0], finalPos[1] - 100]);
        position.setValueAtTime(duration * 0.6, finalPos);
    }
}

function applyLogoOutroTemplate(comp, duration) {
    // Find logo layers
    var logoLayers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.name.toLowerCase().indexOf("logo") !== -1) {
            logoLayers.push(layer);
        }
    }
    
    // Apply outro animation
    for (var j = 0; j < logoLayers.length; j++) {
        var layer = logoLayers[j];
        var startTime = comp.duration - duration;
        
        // Scale outro
        var scale = layer.transform.scale;
        scale.setValueAtTime(startTime, [100, 100]);
        scale.setValueAtTime(startTime + duration * 0.6, [80, 80]);
        scale.setValueAtTime(comp.duration, [0, 0]);
        
        // Opacity fade
        var opacity = layer.transform.opacity;
        opacity.setValueAtTime(startTime + duration * 0.3, 100);
        opacity.setValueAtTime(comp.duration, 0);
    }
}

function applyTransitionTemplate(comp, duration) {
    // Create transition overlay
    var transitionLayer = comp.layers.addSolid([0, 0, 0], "Transition", comp.width, comp.height, 1);
    transitionLayer.moveToBeginning();
    
    // Animate transition
    var opacity = transitionLayer.transform.opacity;
    opacity.setValueAtTime(0, 0);
    opacity.setValueAtTime(duration * 0.4, 100);
    opacity.setValueAtTime(duration * 0.6, 100);
    opacity.setValueAtTime(duration, 0);
    
    // Add motion blur for smoothness
    transitionLayer.motionBlur = true;
    comp.motionBlur = true;
}

// ===========================================================================
// UTILITY AND TOOL FUNCTIONS
// ===========================================================================

function addScaleChecker() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Scale Checker");
        
        // Create a reference scale layer
        var scaleLayer = comp.layers.addSolid([1, 0, 0], "Scale_Reference", 100, 100, 1);
        scaleLayer.transform.position.setValue([comp.width - 60, 60]);
        scaleLayer.label = 1; // Red label
        
        // Add keyframes to show scale changes
        var scale = scaleLayer.transform.scale;
        scale.setValueAtTime(0, [100, 100]);
        scale.setValueAtTime(1, [150, 150]);
        scale.setValueAtTime(2, [100, 100]);
        
        app.endUndoGroup();
        return "success: Scale checker added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function addMotionTile() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Motion Tile");
        
        // Apply Motion Tile effect to active layer
        var activeLayer = getActiveLayer(comp);
        if (!activeLayer) {
            return "Error: No layer selected";
        }
        
        var motionTileEffect = activeLayer.property("Effects").addProperty("ADBE Tile");
        if (motionTileEffect) {
            motionTileEffect.property("Tile Center").setValue([comp.width/2, comp.height/2]);
            motionTileEffect.property("Tile Width").setValue(comp.width * 0.5);
            motionTileEffect.property("Tile Height").setValue(comp.height * 0.5);
        }
        
        app.endUndoGroup();
        return "success: Motion Tile added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function duplicateRotate() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Duplicate and Rotate");
        
        var activeLayer = getActiveLayer(comp);
        if (!activeLayer) {
            return "Error: No layer selected";
        }
        
        // Create duplicates with rotation
        var numberOfCopies = 8;
        var angleStep = 360 / numberOfCopies;
        
        for (var i = 1; i < numberOfCopies; i++) {
            var duplicate = activeLayer.duplicate();
            duplicate.name = activeLayer.name + "_Copy_" + i;
            
            var rotation = duplicate.transform.rotation;
            rotation.setValue(angleStep * i);
            
            // Adjust opacity for visual effect
            duplicate.transform.opacity.setValue(100 - (i * 10));
        }
        
        app.endUndoGroup();
        return "success: Duplicate rotate completed";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function addColorReference() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        app.beginUndoGroup("Add Color Reference");
        
        // Create color reference panel
        var colors = [
            [1, 0, 0],    // Red
            [0, 1, 0],    // Green
            [0, 0, 1],    // Blue
            [1, 1, 0],    // Yellow
            [1, 0, 1],    // Magenta
            [0, 1, 1],    // Cyan
            [1, 1, 1],    // White
            [0, 0, 0]     // Black
        ];
        
        var swatchSize = 50;
        var startX = comp.width - (colors.length * swatchSize + 20);
        var startY = 20;
        
        for (var i = 0; i < colors.length; i++) {
            var colorLayer = comp.layers.addSolid(colors[i], "Color_" + i, swatchSize, swatchSize, 1);
            colorLayer.transform.position.setValue([startX + (i * swatchSize) + swatchSize/2, startY + swatchSize/2]);
            colorLayer.label = i + 1;
        }
        
        app.endUndoGroup();
        return "success: Color reference added";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

// ===========================================================================
// RENDER AND QUEUE MANAGEMENT
// ===========================================================================

function createRenderQueue() {
    try {
        app.beginUndoGroup("Create Render Queue");
        
        var renderQueue = app.project.renderQueue;
        var compsToRender = [];
        
        // Find compositions to render
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && !item.name.match(/^_/)) {
                compsToRender.push(item);
            }
        }
        
        if (compsToRender.length === 0) {
            return "Error: No compositions found to render";
        }
        
        // Add compositions to render queue
        for (var j = 0; j < compsToRender.length; j++) {
            var comp = compsToRender[j];
            var renderItem = renderQueue.items.add(comp);
            
            // Set output module
            var outputModule = renderItem.outputModule(1);
            outputModule.applyTemplate("H.264 - Match Render Settings - 15 Mbps");
            
            // Set output path
            var outputPath = Folder.desktop.fsName + "/" + comp.name + ".mp4";
            outputModule.file = new File(outputPath);
        }
        
        logAction("create_render_queue", {
            compositions_count: compsToRender.length
        });
        
        app.endUndoGroup();
        return "success: Render queue created with " + compsToRender.length + " items";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function removeDuplicateComps() {
    try {
        app.beginUndoGroup("Remove Duplicate Compositions");
        
        var compNames = {};
        var duplicates = [];
        
        // Find duplicates
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                var baseName = item.name.replace(/_\d+$/, ""); // Remove trailing numbers
                
                if (compNames[baseName]) {
                    duplicates.push(item);
                } else {
                    compNames[baseName] = item;
                }
            }
        }
        
        // Remove duplicates
        for (var j = 0; j < duplicates.length; j++) {
            duplicates[j].remove();
        }
        
        app.endUndoGroup();
        return "success: Removed " + duplicates.length + " duplicate compositions";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error: " + e.toString();
    }
}

function selectSpecialScreens() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        // Deselect all layers first
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }
        
        // Select layers that match special criteria
        var selectedCount = 0;
        for (var j = 1; j <= comp.numLayers; j++) {
            var layer = comp.layer(j);
            
            // Special criteria: name contains "special", "hero", or has specific label
            if (layer.name.toLowerCase().indexOf("special") !== -1 ||
                layer.name.toLowerCase().indexOf("hero") !== -1 ||
                layer.label >= 5) {
                layer.selected = true;
                selectedCount++;
            }
        }
        
        return "success: Selected " + selectedCount + " special layers";
        
    } catch (e) {
        return "Error: " + e.toString();
    }
}

function selectByProperty() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "Error: No active composition";
        }
        
        // Select layers by property (example: all 3D layers)
        var selectedCount = 0;
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            layer.selected = false;
            
            if (layer.threeDLayer) {
                layer.selected = true;
                selectedCount++;
            }
        }
        
        return "success: Selected " + selectedCount + " 3D layers";
        
    } catch (e) {
        return "Error: " + e.toString();
    }
}

// ===========================================================================
// HELPER FUNCTIONS
// ===========================================================================

function createProjectFolder(folderName) {
    // Check if folder already exists
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FolderItem && item.name === folderName) {
            return item;
        }
    }
    
    // Create new folder
    return app.project.items.addFolder(folderName);
}

function addGuideLayersToComp(comp, width, height) {
    var w = width || comp.width;
    var h = height || comp.height;
    
    // Add center guides
    var centerGuide = comp.layers.addSolid([1, 0, 0], "Center_Guide", 2, h, 1);
    centerGuide.transform.position.setValue([w/2, h/2]);
    centerGuide.transform.opacity.setValue(50);
    centerGuide.label = 1; // Red label
    centerGuide.shy = true;
    
    var middleGuide = comp.layers.addSolid([1, 0, 0], "Middle_Guide", w, 2, 1);
    middleGuide.transform.position.setValue([w/2, h/2]);
    middleGuide.transform.opacity.setValue(50);
    middleGuide.label = 1; // Red label
    middleGuide.shy = true;
}

function addLEDInfoLayer(comp, ledData) {
    var textLayer = comp.layers.addText(ledData.ledKodu);
    var textDocument = textLayer.property("Source Text").value;
    
    textDocument.fontSize = Math.min(comp.width, comp.height) * 0.05;
    textDocument.fillColor = [1, 1, 1];
    textDocument.font = "Arial-BoldMT";
    textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
    
    var infoText = ledData.ledKodu + "\n" + 
                   ledData.enPx + "x" + ledData.boyPx + "\n" +
                   (ledData.tip || "No Type") + "\n" +
                   (ledData.sehir || "No City");
    
    textDocument.text = infoText;
    textLayer.property("Source Text").setValue(textDocument);
    textLayer.transform.position.setValue([comp.width/2, comp.height - 80]);
    textLayer.name = "LED_Info";
    textLayer.label = 2; // Yellow label
}

function getBackgroundColorForAspect(aspectRatio) {
    if (aspectRatio < 0.8) return [0.1, 0.2, 0.3]; // Blue for vertical
    if (aspectRatio > 1.5) return [0.3, 0.2, 0.1]; // Orange for horizontal
    return [0.2, 0.2, 0.2]; // Gray for square
}

function getLEDBackgroundColor(ledData) {
    // Color coding based on LED type or size
    if (ledData.tip) {
        switch (ledData.tip.toLowerCase()) {
            case "dikey": return [0.1, 0.3, 0.5];
            case "yatay": return [0.5, 0.3, 0.1];
            case "kare": return [0.3, 0.5, 0.1];
            default: return [0.2, 0.2, 0.2];
        }
    }
    return [0.15, 0.15, 0.15];
}

function getActiveLayer(comp) {
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).selected) {
            return comp.layer(i);
        }
    }
    return null;
}

function scaleLayerToFit(layer, comp, fitRatio) {
    fitRatio = fitRatio || 0.8;
    
    var layerWidth = layer.width;
    var layerHeight = layer.height;
    var compWidth = comp.width;
    var compHeight = comp.height;
    
    var scaleX = (compWidth * fitRatio) / layerWidth;
    var scaleY = (compHeight * fitRatio) / layerHeight;
    var scale = Math.min(scaleX, scaleY) * 100;
    
    layer.transform.scale.setValue([scale, scale]);
}

function processAssetsToComposition(comp, assets) {
    for (var i = 0; i < assets.length; i++) {
        var asset = assets[i];
        
        if (asset.filePath && new File(asset.filePath).exists) {
            addAssetToComp(asset.filePath, asset.assetType, asset.assetName);
        }
    }
}

// ===========================================================================
// LOGGING AND DEBUGGING
// ===========================================================================

function logAction(action, details) {
    try {
        var logData = {
            action: action,
            details: details || {},
            timestamp: new Date().toISOString(),
            version: LED_PANEL_VERSION,
            project_name: app.project.file ? app.project.file.name : "Untitled"
        };
        
        // Could be extended to write to file or send to API
        $.writeln("[LED_PANEL_LOG] " + JSON.stringify(logData));
        
    } catch (e) {
        $.writeln("[LED_PANEL_LOG_ERROR] " + e.toString());
    }
}

// ===========================================================================
// INITIALIZATION
// ===========================================================================

// Set up error handling
function handleError(error, functionName) {
    var errorMessage = "Error in " + functionName + ": " + error.toString();
    $.writeln(errorMessage);
    return "Error: " + error.toString();
}

// Initialize plugin
$.writeln("LED Panel Manager ExtendScript loaded - Version " + LED_PANEL_VERSION);