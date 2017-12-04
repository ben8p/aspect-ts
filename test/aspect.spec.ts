import { before, after, afterReturn, afterThrow, around } from '../src/aspect';

describe('aspect', () => {
	describe('before', () => {
		it('should allow to run a method before another one on multiple contexts', () => {
			const global: string[] = [];
			const context1 = {
				foo: () => {
					global.push('foo1');
				},
			};
			const context2 = {
				foo: () => {
					global.push('foo2');
				},
			};
			before(context1, 'foo', () => {
				global.push('before foo1');
			});
			before(context2, 'foo', () => {
				global.push('before foo2');
			});
			expect(global).toEqual([]);
			context1.foo();
			expect(global).toEqual(['before foo1', 'foo1']);
			global.length = 0;
			expect(global).toEqual([]);
			context2.foo();
			expect(global).toEqual(['before foo2', 'foo2']);
		});

		it('should allow to run a method before another one', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			before(context, 'foo', () => {
				global.push('before');
			});
			context.foo();
			expect(global).toEqual(['before', 'foo']);
		});

		it('should handle multiple advices', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			before(context, 'foo', () => {
				global.push('before1');
			});
			before(context, 'foo', () => {
				global.push('before2');
			});
			context.foo();
			expect(global).toEqual(['before1', 'before2', 'foo']);
		});

		it('should allow to remove advice', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			before(context, 'foo', () => {
				global.push('before1');
			});
			const remove = before(context, 'foo', () => {
				global.push('before2');
			});
			context.foo();
			remove();
			context.foo();
			expect(global).toEqual(['before1', 'before2', 'foo', 'before1', 'foo']);
		});

		it('should not fail at removing 2 time the same advice', () => {
			const context = {
				foo: () => void(0),
			};
			const remove = before(context, 'foo', () => void(0));
			remove();
			expect(() => {
				remove();
			}).not.toThrow();
		});
	});

	describe('around', () => {
		it('should allow to run a method around another one', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			around(context, 'foo', (advice) => {
				global.push('around1-before');
				advice();
				global.push('around1-after');
			});
			around(context, 'foo', (advice) => {
				global.push('around2-before');
				advice();
				global.push('around2-after');
			});
			context.foo();
			expect(global).toEqual(['around2-before', 'around1-before', 'foo', 'around1-after', 'around2-after']);
		});

		it('should allow to run a method around another one and return correct values', () => {
			const context = {
				foo: () => {
					return 'foo';
				},
			};
			around(context, 'foo', (advice) => {
				const around1 = advice();
				return `around1-${around1}`;
			});
			around(context, 'foo', (advice) => {
				const around2 = advice();
				return `around2-${around2}`;
			});
			const value = context.foo();
			expect(value).toBe('around2-around1-foo');
		});
		it('should allow to run a method around another one and pass parameters', () => {
			const context = {
				foo: (value) => `${value}4`,
			};
			around(context, 'foo', (value, advice) => advice(`${value}3`));
			around(context, 'foo', (value, advice) => advice(`${value}2`));
			const returnedValue = context.foo('1');
			expect(returnedValue).toBe('1234');
		});
		it('should allow to remove an advice', () => {
			const context = {
				foo: (value) => `${value}4`,
			};
			around(context, 'foo', (value, advice) => advice(`${value}3`));
			const remove = around(context, 'foo', (value, advice) => advice(`${value}2`));
			remove();
			const returnedValue = context.foo('1');
			expect(returnedValue).toBe('134');
		});
		it('should not fail if trying to remove 2 times the same advice', () => {
			const context = {
				foo: () => void(0),
			};
			const remove = around(context, 'foo', (advice) => advice());
			remove();
			expect(() => {
				remove();
			}).not.toThrow();
		});
	});

	describe('afterReturn', () => {
		it('should allow to run a method after another one returns properly', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			afterReturn(context, 'foo', () => {
				global.push('afterReturn');
			});
			context.foo();
			expect(global).toEqual(['foo', 'afterReturn']);
		});

		it('should chain returned values', () => {
			const global: string[] = [];
			const context = {
				foo: (): string => '1',
			};
			let beenThere = false;
			afterReturn(context, 'foo', (value: any) => `${value}2`);
			afterReturn(context, 'foo', (value: any) => {
				expect(value).toEqual('12');
				beenThere = true;
			});
			afterReturn(context, 'foo', (value: any) => `${value}3`);
			const returnedValue = context.foo();
			expect(returnedValue).toEqual('123');
			expect(beenThere).toBe(true); // can't use done because the test continue after setting this to true
		});

		it('should not fire the advice if the method throw', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterReturn(context, 'foo', () => {
				global.push('afterReturn');
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toEqual([]);
		});

		it('should receive the method returned value as argument', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
					return 'bar';
				},
			};
			afterReturn(context, 'foo', (value: any) => {
				global.push('afterReturn');
				expect(value).toBe('bar');
			});
			context.foo();
			expect(global).toEqual(['foo', 'afterReturn']);
		});

		it('should handle multiple advices', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			afterReturn(context, 'foo', () => {
				global.push('afterReturn1');
			});
			afterReturn(context, 'foo', () => {
				global.push('afterReturn2');
			});
			context.foo();
			expect(global).toEqual(['foo', 'afterReturn1', 'afterReturn2']);
		});

		it('should allow to remove advice', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			afterReturn(context, 'foo', () => {
				global.push('afterReturn1');
			});
			const remove = afterReturn(context, 'foo', () => {
				global.push('afterReturn2');
			});
			context.foo();
			remove();
			context.foo();
			expect(global).toEqual(['foo', 'afterReturn1', 'afterReturn2', 'foo', 'afterReturn1']);
		});
	});

	describe('afterThrow', () => {
		it('should not fire advice the method returns properly', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			afterThrow(context, 'foo', () => {
				global.push('afterThrow');
			});
			context.foo();
			expect(global).toEqual(['foo']);
		});

		it('should fire the advice if the method throw', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', () => {
				global.push('afterThrow');
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toEqual(['afterThrow']);
		});

		it('should receive the error as argument', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', (value: any) => {
				global.push('afterThrow');
				expect(value instanceof Error).toBe(true);
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toEqual(['afterThrow']);
		});

		it('should handle multiple advices', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', () => {
				global.push('afterThrow1');
			});
			afterThrow(context, 'foo', () => {
				global.push('afterThrow2');
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toEqual(['afterThrow1', 'afterThrow2']);
		});

		it('should allow to remove advice', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', () => {
				global.push('afterThrow1');
			});
			const remove = afterThrow(context, 'foo', () => {
				global.push('afterThrow2');
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			remove();
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toEqual(['afterThrow1', 'afterThrow2', 'afterThrow1']);
		});
	});

	describe('after', () => {
		it('should fire advice the method returns properly', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			after(context, 'foo', () => {
				global.push('after');
			});
			context.foo();
			expect(global).toEqual(['foo', 'after']);
		});

		it('should fire the advice if the method throw', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			after(context, 'foo', () => {
				global.push('after');
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toEqual(['after']);
		});

		it('should handle multiple advices', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			after(context, 'foo', () => {
				global.push('after1');
			});
			after(context, 'foo', () => {
				global.push('after2');
			});
			context.foo();
			expect(global).toEqual(['foo', 'after1', 'after2']);
		});

		it('should allow to remove advice', () => {
			const global: string[] = [];
			const context = {
				foo: () => {
					global.push('foo');
				},
			};
			after(context, 'foo', () => {
				global.push('after1');
			});
			const remove = after(context, 'foo', () => {
				global.push('after2');
			});
			context.foo();
			remove();
			context.foo();
			expect(global).toEqual(['foo', 'after1', 'after2', 'foo', 'after1']);
		});
	});
});
