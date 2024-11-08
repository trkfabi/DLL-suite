#Propelics TextArea with HintText [Titanium Widget]

##Overview
This widget acts as a normal TextArea with the addition of a HintText property

####How to use it
1. Download the widget folder and paste it into the widgets directory.

2. Include the widget to the config.json dependencies object i.e:
	
	```javascript
	"dependencies": {
	    "com.propelics.textarea.hint": "1.0"
	}
	```

3. Require the widget in the controller or view file  i.e:
	
	```xml
	<!-- View File -->
	<Widget id='textArea' src='com.propelics.textarea.hint' />

	<!-- An additional keyboard can be added -->
	<Widget id='textArea' src='com.propelics.textarea.hint'>
		<KeyboardToolbar>
			<Toolbar>
				<Items>
					<Button systemButton="Ti.UI.iOS.SystemButton.CANCEL" />
					<FlexSpace/>
					<Button systemButton="Ti.UI.iOS.SystemButton.CAMERA" />
					<FlexSpace/>
					<Button style="Ti.UI.iOS.SystemButtonStyle.DONE">Send</Button>
				</Items>
			</Toolbar>
		</KeyboardToolbar>
	</Widget>
	```
	```javascript
	// Style File
	'#textArea' : {
		top : 10,
		left : 10,
		right : 10,
		hintText : 'Some Hint',
		color : Alloy.Globals.colors.black,
		hintTextColor : Alloy.Globals.colors.gray,
		backgroundColor : Alloy.Globals.colors.white,
		font : {
			fontFamily : Alloy.Globals.fonts.regular,
			fontSize : 13
		}
	}
	```
	```javascript
 	$.textArea = Alloy.createWidget('com.propelics.textarea.hint');
	
	function handleTextAreaChange (_evt) {
		//Do something
		$.textArea.setValue('New value'); //Sets a new value on the text area
	};

 	$.textArea.addEventListener('change', handleTextAreaChange);

	```

## TODO'S

* Set variable values proper to the hint text after the textArea has been created:

	* `setColor()`
	* `setHintText()`
	* `setHintTextColor()`