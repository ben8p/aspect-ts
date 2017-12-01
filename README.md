# aspectTS
A simple typescript Aspect implementation for AOP (Aspect Oriented Programming)

## Install
`yarn install`

## Development

For development two tasks are available:
  * __yarn test__ - Runs the tests
  * __yarn build__ - Transpile the code into .dist directory

## Usage
The package exposes 5 methods :
  * __before__  
  Allow to run an advice before a chosen method.
  ```
  const x = new MyClass(); // assuming MyClass has a method doIt();
  before(x, 'doIt', () => {
  	console.log('this runs before doIt()');
  });
  ```
  * __after__  
  Allow to run an advice after a chosen method, regardless the success or the failure of that method
  ```
  const x = new MyClass(); // assuming MyClass has a method doIt();
  after(x, 'doIt', () => {
  	console.log('this runs after doIt()');
  });
  ```
  * __afterReturn__  
  Allow to run an advice after a chosen method, if and only if the method successfully returns
  ```
  const x = new MyClass(); // assuming MyClass has a method doIt();
  afterReturn(x, 'doIt', () => {
  	console.log('doIt() method passed successfully');
  });
  ```
  * __afterThrow__  
  Allow to run an advice after a chosen method, if and only if the method throw an error
  ```
  const x = new MyClass(); // assuming MyClass has a method doIt();
  afterThrow(x, 'doIt', () => {
  	console.log('doIt() method thrown an error');
  });
  ```
  * __around__  
  Allow to run an advice before and after a chosen method. This is the most powerful kind of advice as it can controls whether or not to run the original method as well as the arguments given to it.
  ```
  const x = new MyClass(); // assuming MyClass has a method doIt();
  around(x, 'doIt', (nextAdvice) => {
  	console.log('this runs before doIt()');
  	nextAdvice(); // next advice might be another around or the doIt() method itself
  	console.log('this runs after doIt()');
  });
  ```
  ```
  // with arguments:
  const x = new MyClass(); // assuming MyClass has a method doIt(value);
  around(x, 'doIt', (value, nextAdvice) => {
  	console.log('this runs before doIt()');
  	nextAdvice(value); // next advice might be another around or the doIt() method itself
  	console.log('this runs after doIt()');
  });
  ```
