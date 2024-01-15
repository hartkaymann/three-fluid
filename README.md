# three-fluid
Interactive real-time 3D eulerian fluid simulation implemented with Three.js.

This is still a work in progess.


## Running it
To run the code on your own device, do:
```
git clone https://github.com/hartkaymann/three-fluid.git
cd three-fluid
npm install
npm run dev
```
This will start a local Vite development server, which provides all of the required dependencies.
Then, open a browser that supports WebGL2 on the specified port.

`localhost:XXXX`

## Demo
The most up to date version of the application can generally be found [here](https://hartkaymann.com/fluid/).
It can run in any browser that supports WebGL2 (which are all somewhat modern browsers).
The performance will differ depending on the graphics hardware of your device, but the settings can be adjusted to account for that.

**Note**: A mouse should be used to be able to interact with the simulation properly. 
Trackpads currently can't seem to rotate the camera, while touch can only rotate the camera. 
