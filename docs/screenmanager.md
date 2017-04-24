# Screen Manager

Note: on hold for now.

Client application asserts 'BrowserView' to the server. Server signal no longer active on disconnect. Server collates and reports to registered manager(s). Client optionally specifies name (in URL parameter). BrowserView itself is new temporary ID (GUID?). 

Manager registers to get BrowserView assertions (active and inactive). Manager shows BrowserViews. 

Manager allows ScreenTemplates and Scenes to be created and edited, including Frames and ScreenSplits. Allows ScreenApps to be created and edited. Allows ScreenApps to be associated with Frames. 

Manager allows ScreenTemplates to be applied to BrowserViews, and sends these and any changes in configuration to server to send to active BrowserViews.

Manager allows ScreenTemplates and Scenes to be saved and loaded. 
