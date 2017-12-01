import { before, after, afterReturn, afterThrow, around } from '../src/aspect';

describe('aspect', () => {
	describe('before', () => {
		it('should allow to run a method before another one', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			before(context, 'foo', () => {
				global += 'before';
			});
			context.foo();
			expect(global).toBe('beforefoo');
		});

		it('should handle multiple advices', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			before(context, 'foo', () => {
				global += 'before1';
			});
			before(context, 'foo', () => {
				global += 'before2';
			});
			context.foo();
			expect(global).toBe('before1before2foo');
		});

		it('should allow to remove advice', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			before(context, 'foo', () => {
				global += 'before1';
			});
			const remove = before(context, 'foo', () => {
				global += 'before2';
			});
			context.foo();
			remove();
			context.foo();
			expect(global).toBe('before1before2foobefore1foo');
		});

		it('should not fail at removing 2 time the same advice', () => {
			const context = {
				foo: () => {
					// nothing
				},
			};
			const remove = before(context, 'foo', () => {
				// nothing
			});
			remove();
			expect(() => {
				remove();
			}).not.toThrow();
		});
	});

	describe('around', () => {
		it('should allow to run a method around another one', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			around(context, 'foo', (advice) => {
				global += 'around-before';
				advice();
				global += 'around-after';
			});
			around(context, 'foo', (advice) => {
				global += 'around2-before';
				advice();
				global += 'around2-after';
			});
			const v = context.foo();
			expect(global).toBe('around2-beforearound-beforefooaround-afteraround2-after');
		});

		it('should allow to run a method around another one and return correct values', () => {
			const context = {
				foo: () => {
					return 'q';
				},
			};
			around(context, 'foo', (advice) => {
				const around1 = advice();
				return `w${around1}`;
			});
			around(context, 'foo', (advice) => {
				const around2 = advice();
				return `e${around2}`;
			});
			const v = context.foo();
			expect(v).toBe('ewq');
		});
		it('should allow to run a method around another one and pass parameters', () => {
			const context = {
				foo: (value) => `4${value}`,
			};
			around(context, 'foo', (value, advice) => advice(`3${value}`));
			around(context, 'foo', (value, advice) => advice(`2${value}`));
			const v = context.foo('1');
			expect(v).toBe('4321');
		});
		it('should allow to remove and advice', () => {
			const context = {
				foo: (value) => `4${value}`,
			};
			around(context, 'foo', (value, advice) => advice(`3${value}`));
			const remove = around(context, 'foo', (value, advice) => advice(`2${value}`));
			remove();
			const v = context.foo('1');
			expect(v).toBe('431');
		});
		it('should not fail if trying to remove 2 times the same advice', () => {
			const context = {
				foo: () => {
					// nothing
				},
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
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			afterReturn(context, 'foo', () => {
				global += 'after';
			});
			context.foo();
			expect(global).toBe('fooafter');
		});

		it('should chain returned values', () => {
			const context = {
				foo: () => 'foo',
			};
			let beenThere = false;
			afterReturn(context, 'foo', (value: any) => `after1${value}`);
			afterReturn(context, 'foo', (value: any) => {
				expect(value).toEqual('after1foo');
				beenThere = true;
			});
			afterReturn(context, 'foo', (value: any) => `after3${value}`);
			const returnValue = context.foo();
			expect(returnValue).toEqual('after3after1foo');
			expect(beenThere).toBe(true); // can't use done because the test continue after setting this to true
		});

		it('should not fire the advice if the method throw', () => {
			let global = '';
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterReturn(context, 'foo', () => {
				global += 'after';
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toBe('');
		});

		it('should receive the method returned value as argument', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
					return 'bar';
				},
			};
			afterReturn(context, 'foo', (value: any) => {
				global += 'after';
				expect(value).toBe('bar');
			});
			context.foo();
			expect(global).toBe('fooafter');
		});

		it('should handle multiple advices', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			afterReturn(context, 'foo', () => {
				global += 'after1';
			});
			afterReturn(context, 'foo', () => {
				global += 'after2';
			});
			context.foo();
			expect(global).toBe('fooafter1after2');
		});

		it('should allow to remove advice', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			afterReturn(context, 'foo', () => {
				global += 'after1';
			});
			const remove = afterReturn(context, 'foo', () => {
				global += 'after2';
			});
			context.foo();
			remove();
			context.foo();
			expect(global).toBe('fooafter1after2fooafter1');
		});
	});

	describe('afterThrow', () => {
		it('should not fire advice the method returns properly', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			afterThrow(context, 'foo', () => {
				global += 'after';
			});
			context.foo();
			expect(global).toBe('foo');
		});

		it('should fire the advice if the method throw', () => {
			let global = '';
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', () => {
				global += 'after';
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toBe('after');
		});

		it('should receive the error as argument', () => {
			let global = '';
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', (value: any) => {
				global += 'after';
				expect(value instanceof Error).toBe(true);
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toBe('after');
		});

		it('should handle multiple advices', () => {
			let global = '';
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', () => {
				global += 'after1';
			});
			afterThrow(context, 'foo', () => {
				global += 'after2';
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toBe('after1after2');
		});

		it('should allow to remove advice', () => {
			let global = '';
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			afterThrow(context, 'foo', () => {
				global += 'after1';
			});
			const remove = afterThrow(context, 'foo', () => {
				global += 'after2';
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
			expect(global).toBe('after1after2after1');
		});
	});

	describe('after', () => {
		it('should fire advice the method returns properly', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			after(context, 'foo', () => {
				global += 'after';
			});
			context.foo();
			expect(global).toBe('fooafter');
		});

		it('should fire the advice if the method throw', () => {
			let global = '';
			const context = {
				foo: () => {
					throw new Error();
				},
			};
			after(context, 'foo', () => {
				global += 'after';
			});
			try {
				context.foo();
			} catch (error) {
				// nothing
			}
			expect(global).toBe('after');
		});

		it('should handle multiple advices', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			after(context, 'foo', () => {
				global += 'after1';
			});
			after(context, 'foo', () => {
				global += 'after2';
			});
			context.foo();
			expect(global).toBe('fooafter1after2');
		});

		it('should allow to remove advice', () => {
			let global = '';
			const context = {
				foo: () => {
					global += 'foo';
				},
			};
			after(context, 'foo', () => {
				global += 'after1';
			});
			const remove = after(context, 'foo', () => {
				global += 'after2';
			});
			context.foo();
			remove();
			context.foo();
			expect(global).toBe('fooafter1after2fooafter1');
		});
	});
});
