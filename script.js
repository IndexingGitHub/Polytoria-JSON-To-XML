/*
let XMLConverter;
!(async () => {
    console.log('start')
    //XMLConverter = await import('https://cdn.jsdelivr.net/npm/json2xml@0.1.3/+esm')
    XMLConverter = await import('https://cdn.jsdelivr.net/npm/x2js@3.4.4/+esm')
    XMLConverter = XMLConverter.default
    XMLConverter = new XMLConverter()
    console.log(XMLConverter)
})();
*/

const URLParams = new URLSearchParams(new URL(window.location.href).search)
const Debug = URLParams.get('debug')

let Doc;
let Game;
let FileName;

const FileInput = document.getElementById('file')
const Sandbox = document.getElementById('sandbox')
const SubmitBtn = document.getElementById('submit-btn')
const SaveBtn = document.getElementById('save-btn')

const EnumTypes = {
    AmbientSource: {
        type: "int",
        values: [
            "Skybox",
            "AmbientColor"
        ]
    },
    Mode: {
        type: "int",
        values: [
            "Scripted",
            "FollowPlayer",
            "Free"
        ]
    },
    ImageType: {
        type: "int",
        values: [
            "Asset",
            "AssetThumbnail",
            "PlaceThumbnail",
            "UserAvatarHeadshot",
            "GuildIcon"
        ]
    },
    Shape: {
        type: "int",
        values: [
            "Brick",
            "Ball",
            "Cylinder",
            "Wedge",
            "Truss",
            "TrussFrame",
            "Bevel",
            "QuarterPipe"
        ]
    },
    Material: {
        type: "int",
        values: [
            "SmoothPlastic",
            "Wood",
            "Concrete",
            "Neon",
            "Metal",
            "Brick",
            "Grass",
            "Dirt",
            "Stone",
            "Snow",
            "Ice",
            "RustyIron",
            "Sand",
            "Sandstone",
            "Plastic",
            "Plywood",
            "Planks"
        ]
    },
    Text: {type: "string"},
    Source: {type: "string"},
    Skybox: {
        type: "int",
        values: [
            "Day1",
            "Day2",
            "Day3",
            "Day4",
            "Day5",
            "Day6",
            "Day7",
            "Morning1",
            "Morning2",
            "Morning3",
            "Morning4",
            "Night1",
            "Night2",
            "Night3",
            "Night4",
            "Night5",
            "Sunset1",
            "Sunset2",
            "Sunset3",
            "Sunset4",
            "Sunset5"
        ]
    },
    Font: {
        type: "int",
        values: [
            "SourceSans",
            "PressStart2P",
            "Montserrat",
            "RobotoMono",
            "Rubik",
            "Poppins",
            "Domine",
            "Fredoka",
            "ComicNeue",
            "Obitron"
        ]
    },
    JustifyText: {
        type: "int",
        values: [
            "Left",
            "Center",
            "Right",
            "Justify",
            "Flush"
        ]
    },
    HorizontalAlignment: {
        type: "int",
        values: [
            "Left",
            "Middle",
            "Right"
        ]
    },
    VerticalAlignment: {
        type: "int",
        values: [
            "Top",
            "Middle",
            "Bottom"
        ]
    },
    // Not sure why I added TweenStyle enum as it is only used in scripts but I am too lazy to delete it incase it is needed eventually
    TweenStyle: {
        type: "int",
        values: [
            "easeInBack",
            "easeInBounce",
            "easeInCirc",
            "easeInCubic",
            "easeInElastic",
            "easeInExpo",
            "easeInOutBack",
            "easeInOutBounce",
            "easeInOutCirc",
            "easeInOutCubic",
            "easeInOutElastic",
            "easeInOutExpo",
            "easeInOutQuad",
            "easeInOutQuart",
            "easeInOutQuint",
            "easeInOutSine",
            "easeInQuad",
            "easeInQuart",
            "easeInQuint",
            "easeInSine",
            "easeOutBack",
            "easeOutBounce",
            "easeOutCirc",
            "easeOutCubic",
            "easeOutElastic",
            "easeOutExpo",
            "easeOutQuad",
            "easeOutQuart",
            "easeOutQuint",
            "easeOutSine",
            "linear",
            "punch"
        ]
    }
}

const Incompatible = {
    Classes: [
        "Camera",
        "SunLight"
    ],
    Properties: [
        "InstanceIndex",
        "InstanceID",
        "DepthEnabled",
        "DepthAmount"
    ]
}
// just realized I can't include full list cause it's private so never mind lol

// Read file and run Submit function
function Read() {
    const File = FileInput.files[0]
    const Reader = new FileReader()
    Reader.addEventListener('loadend', async function(){
        FileName = File.name
        Submit(Reader.result)
    });
    Reader.readAsText(File)
}

function Submit(content) {
    // Parse the XML
    const Parser = new DOMParser()
    content = content.replace('<?xml version="1.0" encoding="UTF-8" ?>', '<?xml version="1.0" encoding="UTF-8" ?>\n<game>')
    content = content + "\n</game>"
    Doc = Parser.parseFromString(content, 'application/xml')

    // Check for errors
    if (Doc.getElementsByTagName('parsererror').length > 0) {
        Log('error', 'Erroring while parsing JSON file')
        alert('There was an error when parsing your JSON file.')
    } else {
        Log('log', 'Disabled interaction buttons')
        SubmitBtn.disabled = true
        FileInput.disabled = true
    }
    
    Game = Doc.children[0]
    
    // Add XML to Sandbox element to allow for editing
    Log('log', 'Loaded sandbox element')
    Sandbox.appendChild(Game)

    // Move Version tag to game attribute
    const Version = Game.getElementsByTagName('Version')[0]
    // not sure if Polytoria Unity creator will error if the version is greater than the current version so:
    //Game.setAttribute('version', "1.3.43")
    Version.remove()
    Log('log', 'Removed Version Tag')

    // Remove Type tag
    Game.getElementsByTagName('Type')[0].remove()
    Log('log', 'Removed File Type Tag')

    Array.from(Game.querySelectorAll('Root, Children')).forEach(item => {
        // Change Root -> Item[class] and Children -> Item[class]
        const Class = item.getElementsByTagName('Class')[0]
        Log('log', 'Define Class: ' + Class.innerHTML)
        if (Incompatible.Classes.indexOf(Class.innerHTML) !== -1) {
            item.remove()
            return
        }
        item = ChangeTagName(item, "Item")
        item.classList.add(Class.innerHTML)
        Class.remove();

        // Merge Properties
        Log('log', 'Merge Properties')
        const Properties = document.createElement('Properties')

        Array.from(item.children).filter((x) => x.tagName !== "Children").forEach(property => { Properties.appendChild(property) })
        item.prepend(Properties)

        const Groups = new Set()
        Array.from(Properties.children).filter((x) => Properties.getElementsByTagName(x.tagName).length > 1).forEach(property => {
            if (!Groups.has(property.tagName)) {
                Groups.add(property.tagName)

                let Merged;
                const SplitProperties = Array.from(Properties.getElementsByTagName(property.tagName)).map((x) => x.tag)
                switch (SplitProperties.length) {
                    case 2:
                        Merged = MergeProperties(property.tagName, Properties, ["X", "Y"])
                        break
                    case 3:
                        Merged = MergeProperties(property.tagName, Properties, ["X", "Y", "Z"])
                        break
                    case 4:
                        Merged = MergeProperties(property.tagName, Properties, ["R", "G", "B", "A"])
                        break
                }
                Properties.replaceChild(Merged, property)
            } else {
                property.remove()
            }
        })

        if (Properties.getElementsByTagName('Name')[0] !== undefined) {
            Log('log', 'Remove "Name" Property: ' + item.getAttribute('class'))
            Properties.getElementsByTagName('Name')[0].remove()
        }

        Array.from(Properties.children).forEach(property => {
            Log('log', 'Handle Property: ' + property.tagName)
            if (Incompatible.Properties.indexOf(property.tagName) !== -1) {
                Log('log', 'Incompatible Property: ' + property.tagName)
                property.remove()
                return
            }

            // Vector3
            if (property.getElementsByTagName('x')[0] && property.getElementsByTagName('y')[0] && property.getElementsByTagName('z')[0]) {
                property.setAttribute('name', Capitalize(property.tagName))
                ChangeTagName(property, "vector3")
            }

            // Vector3
            if (property.getElementsByTagName('x')[0] && property.getElementsByTagName('y')[0] && !property.getElementsByTagName('z')[0]) {
                property.setAttribute('name', Capitalize(property.tagName))
                ChangeTagName(property, "vector2")
            }

            // Color
            if (property.getElementsByTagName('r')[0] && property.getElementsByTagName('g')[0] && property.getElementsByTagName('b')[0]) {
                const normalizeRatio = (value, min, max) => (value - min) / (max - min);
                
                for (let subproperty of property.children) {
                    let normalized = normalizeRatio(parseFloat(subproperty.innerHTML), 0, 255);
                    subproperty.innerHTML = normalized
                }
                
                property.setAttribute('name', Capitalize(property.tagName))
                ChangeTagName(property, "color")
            }

            // Integer / Float
            if (!isNaN(property.innerHTML) && property.innerHTML !== "") {
                property.setAttribute('name', Capitalize(property.tagName))
                if (HasDecimal(parseInt(property.innerHTML)) === true) {
                    ChangeTagName(property, "float")
                } else {
                    ChangeTagName(property, "int")
                }
            }

            // Boolean
            if (property.innerHTML === "true" || property.innerHTML === "false") {
                property.setAttribute('name', Capitalize(property.tagName))
                ChangeTagName(property, "boolean")
            }

            // Enums
            let Enum = Object.keys(EnumTypes).indexOf(property.tagName)
            if (Enum !== -1) {
                Enum = Object.values(EnumTypes)[Enum]
                if (Enum.values !== undefined) {
                    if (!isNaN(property.innerHTML)) { property.innerHTML = parseFloat(property.innerHTML) }
                    property.innerHTML = Enum.values.indexOf(property.innerHTML)
                }
                property.setAttribute('name', Capitalize(property.tagName))
                ChangeTagName(property, 'string')
            }
        })

        const NameProperty = document.createElement('string')
        NameProperty.setAttribute('name', 'Name')
        NameProperty.innerHTML = item.classList[0]
        Properties.appendChild(NameProperty)
    })

    SaveBtn.disabled = false
    Log('result', Game)
}

function Save() {
    let XMLString = new XMLSerializer().serializeToString(Game)
        .replaceAll(' xmlns=""', '')
        .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', '')
        .replaceAll(' >', '>')
    //    .replaceAll('/x>', '/X>')
    //    .replaceAll('/y>', '/Y>')
    //    .replaceAll('/z>', '/Z>')
    //    .replaceAll('/r>', '/R>')
    //    .replaceAll('/g>', '/G>')
    //    .replaceAll('/b>', '/B>')
    //    .replaceAll('/a>', '/A>')
    //    .replaceAll('/item>', '/Item>')
    //    .replaceAll('/properties', '/Properties')
    //    .replaceAll('<properties', '<Properties')
    //    .replaceAll('<item', '<Item')
    //    .replaceAll('<x', '<X')
    //    .replaceAll('<y', '<Y')
    //    .replaceAll('<z', '<Z')
    //    .replaceAll('<r', '<R')
    //    .replaceAll('<g', '<G')
    //    .replaceAll('<b', '<B')
    //    .replaceAll('<a', '<A')
    //    .replace('<Game', '<game')
    //    .replaceAll('<Boolean', '<boolean')
        .replaceAll('name="Localposition"', 'name="LocalPosition"')
        .replaceAll('name="Localrotation"', 'name="LocalRotation"')
        .replaceAll('name="Localsize"', 'name="LocalSize"')
        .replaceAll('name="Chatcolor"', 'name="ChatColor"')
        .replace(/^\s*[\r\n]/gm, '')

    const ToUpperCase = ["x", "y", "z", "r", "g", "b", "a", "properties", "item"]
    const ToLowerCase = ["Game", "Boolean"]
    ToUpperCase.forEach(tagName => {
        XMLString = XMLString.replaceAll("<" + tagName + ">", "<" + Capitalize(tagName) + ">")
        XMLString = XMLString.replaceAll("</" + tagName + ">", "</" + Capitalize(tagName) + ">")
    })
    ToLowerCase.forEach(tagName => {
        XMLString = XMLString.replaceAll("<" + tagName + ">", "<" + tagName.toLowerCase() + ">")
        XMLString = XMLString.replaceAll("</" + tagName + ">", "</" + tagName.toLowerCase() + ">")
    })

    XMLString = '<?xml version="1.0" encoding="UTF-8" ?>\n' + XMLString

    const JSONBlob = new Blob([XMLString], {type: "application/xml"})
    const DownloadURL = URL.createObjectURL(JSONBlob)

    const Link = document.createElement('a')
    Link.href = DownloadURL
    Link.download = FileName
    document.body.appendChild(Link)
    Link.click()
    Link.remove()
}

function MergeProperties(name, parent, keys) {
    const Properties = parent.getElementsByTagName(name)
    if (Properties.length === 1) { return }

    const NewParent = document.createElement(name)

    const Values = Array.from(Properties).map((x) => x.innerHTML)
    Values.forEach((value, index) => {
        const NewSubProperty = document.createElement(keys[index])
        NewSubProperty.innerHTML = value
        if (!isNaN(NewSubProperty.innerHTML)) {
            NewSubProperty.innerHTML = parseFloat(value).toFixed(4)
        }
        NewParent.appendChild(NewSubProperty)
    })

    return NewParent
}

function ChangeTagName(element, newTagName) {
    if (element.parentNode === null) {return}
    var newElement = document.createElement(newTagName);
    Array.from(element.attributes).forEach(attr => {
        newElement.setAttribute(attr.name, attr.value);
    });
    while (element.firstChild) {
        newElement.appendChild(element.firstChild);
    }
    element.parentNode.replaceChild(newElement, element);
    return newElement
}

function Capitalize(string) {
    if (string.toUpperCase() === string) {
        return string[0].toUpperCase() + string.substring(1).toLowerCase()
    } else {
        return string[0].toUpperCase() + string.substring(1)
    }
}

function HasDecimal(number) {
    return number % 1 !== 0;
}

function Log(type, string) {
    if (Debug === false || Debug === null) { return }
    if (type === "log") {
        console.log('%cLog', 'color: #fff; padding: 1px; padding-right: 5px; padding-left: 5px; background: #000; border-radius: 10px', string);
    } else if (type === "error") {
        console.log('%cError', 'color: #fff; padding: 1px; padding-right: 5px; padding-left: 5px; background: orangered; border-radius: 10px', string);
    } else if (type === "result") {
        console.log('%cResult', 'color: #fff; padding: 1px; padding-right: 5px; padding-left: 5px; background: #007bff; border-radius: 10px', string);
    }
}
