const URLParams = new URLSearchParams(new URL(window.location.href).search)
const Debug = URLParams.get('debug')

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
        "Class",
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
        FileInput.disabled = true
        SubmitBtn.disabled = true
        Submit(Reader.result)
    });
    Reader.readAsText(File)
}

function Submit(content) {
    // Parse JSON and create empty XML document
    const Parsed = JSON.parse(content)
    console.log(Parsed)
    Game = (new DOMParser()).parseFromString('<game/>', 'text/xml').children[0]

    Parsed.Root.forEach(object => {
        FormatObject(Game, object)
    })

    SaveBtn.disabled = false
}

function Save() {
    let XMLString = new XMLSerializer().serializeToString(Game)
        .replaceAll(' xmlns=""', '')
        .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', '')
        .replaceAll(' >', '>')
        .replaceAll('name="Localposition"', 'name="LocalPosition"')
        .replaceAll('name="Localrotation"', 'name="LocalRotation"')
        .replaceAll('name="Localsize"', 'name="LocalSize"')
        .replaceAll('name="Chatcolor"', 'name="ChatColor"')
        .replace(/^\s*[\r\n]/gm, '')
    const ToUpperCase = ["x", "y", "z", "r", "g", "b", "a", "properties", "item"]
    const ToLowerCase = ["Game", "Boolean"]
    ToUpperCase.forEach(tagName => {
        XMLString = XMLString.replaceAll("<" + tagName, "<" + Cap(tagName))
        XMLString = XMLString.replaceAll("</" + tagName + ">", "</" + Cap(tagName) + ">")
    })
    ToLowerCase.forEach(tagName => {
        XMLString = XMLString.replaceAll("<" + tagName, "<" + tagName.toLowerCase())
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

function FormatObject(parent, object) {
    if (Incompatible.Classes.indexOf(object.Class) !== -1) { return }

    const ObjectElement = document.createElement('Item')
    ObjectElement.setAttribute('class', object.Class)

    const Properties = document.createElement('Properties')
    const Keys = Object.keys(object)
    Object.values(object).forEach((property, key) => {
        key = Keys[key]
        FormatProperty(property, key, Properties)
    })
    parent.appendChild(ObjectElement)
    ObjectElement.appendChild(Properties)

    if (object.Children !== undefined && object.Children.length > 0) {
        object.Children.forEach(descendant => {
            FormatObject(ObjectElement, descendant)
        })
    }
}

function FormatProperty(property, key, Properties) {
    if (Incompatible.Properties.indexOf(key) === -1) {
        const Type = GetPropertyType(property)
        if (Type !== "object") {
            let PropertyObject = document.createElement(Type)
            let Enum = Object.keys(EnumTypes).indexOf(key)
            let Info = Object.values(EnumTypes)[Enum]
            if (Enum !== -1 && Info.values !== undefined) {
                const Value = Info.values.indexOf(property)
                PropertyObject = document.createElement(Info.type)
                PropertyObject.innerHTML = Value
            } else {
                PropertyObject.innerHTML = property
            }
            PropertyObject.setAttribute('name', key)
            Properties.appendChild(PropertyObject)
        } else {
            let SpecificType;
            if (property.length === 2) {
                SpecificType = 'vector2'
            } else if (property.length === 3) {
                SpecificType = 'vector3'
            } else if (property.length === 4) {
                SpecificType = 'color'
            }
            if (SpecificType !== undefined) {
                const PropertyObject = document.createElement(SpecificType)
                PropertyObject.setAttribute('name', key)
                property.forEach((subproperty, i) => {property[i] = parseFloat(subproperty).toFixed(4)})
                if (SpecificType === 'vector2') {
                    PropertyObject.innerHTML = `
                    <X>${property[0]}</X>
                    <Y>${property[1]}</Y>
                    `
                } else if (SpecificType === 'vector3') {
                    PropertyObject.innerHTML = `
                    <X>${property[0]}</X>
                    <Y>${property[1]}</Y>
                    <Z>${property[2]}</Z>
                    `
                } else if (SpecificType === 'color') {
                    const AdjustRange = (value, min, max) => (value - min) / (max - min);
                    PropertyObject.innerHTML = `
                    <R>${AdjustRange(property[0], 0, 255)}</R>
                    <G>${AdjustRange(property[1], 0, 255)}</G>
                    <B>${AdjustRange(property[2], 0, 255)}</B>
                    <A>${AdjustRange(property[3], 0, 255)}</A>
                    `
                }
                Properties.appendChild(PropertyObject)
            }
        }
    }
}

function GetPropertyType(value) {
    if (value === true || value === false) {
        return 'boolean'
    } else if (!isNaN(value)) {
        if (parseFloat(value) % 1 !== 0) {
            return 'float'
        }
        return 'int'
    } else {
        return typeof(value)
    }
}

function Cap(string) {
    if (string.toUpperCase() === string) {
        return string[0].toUpperCase() + string.substring(1).toLowerCase()
    } else {
        return string[0].toUpperCase() + string.substring(1)
    }
}
