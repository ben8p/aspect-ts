interface IAdviceFunction extends Function {
	advices?: {
		afterReturn: Function[];
		afterThrow: Function[];
		around: Function[];
		before: Function[];
	};
	originalMethod?: Function;
}
function getAdviceRunner(context: any, method: string): IAdviceFunction {
	if (!context[method].advices) {
		const adviceRunner: IAdviceFunction = (...kwArgs: any[]): any => {
			adviceRunner.advices.before.forEach((beforeAdvice: Function) => {
				beforeAdvice(...kwArgs);
			});
			let returnedValue: any;
			try {
				const stack = [(...stackArgs: any[]) => adviceRunner.originalMethod(...stackArgs)];
				adviceRunner.advices.around.forEach((aroundAdvice: Function) => {
					const previous = stack[stack.length - 1];
					stack.push((...stackArgs: any[]) => aroundAdvice(...stackArgs, previous));
				});
				returnedValue = (stack.pop())(...kwArgs);
			} catch (error) {
				adviceRunner.advices.afterThrow.forEach((afterThrowAdvice: Function) => {
					afterThrowAdvice(...kwArgs, error);
				});
				throw error;
			}
			adviceRunner.advices.afterReturn.forEach((afterReturnAdvice: Function) => {
				const newReturnedValue = afterReturnAdvice(...kwArgs, returnedValue);
				if (newReturnedValue !== undefined) {
					returnedValue = newReturnedValue;
				}
			});
			return returnedValue;
		};
		adviceRunner.advices = {
			afterReturn: [],
			afterThrow: [],
			around: [],
			before: [],
		};
		adviceRunner.originalMethod = context[method].bind(context);
		context[method] = adviceRunner;
	}
	return context[method];
}
function removeAdvice(path: Function[], advice: Function): boolean {
	const index = path.indexOf(advice);
	if (index === -1) {
		return false;
	}
	path.splice(index, 1);
	return true;
}

export function around(context: any, method: string, advice: Function): Function {
	const runner = getAdviceRunner(context, method);
	runner.advices.around.push(advice);

	return () => removeAdvice(runner.advices.around, advice);
}
export function before(context: any, method: string, advice: Function): Function {
	const runner = getAdviceRunner(context, method);
	runner.advices.before.push(advice);

	return () => removeAdvice(runner.advices.before, advice);
}
export function afterReturn(context: any, method: string, advice: Function): Function {
	const runner = getAdviceRunner(context, method);
	runner.advices.afterReturn.push(advice);

	return () => removeAdvice(runner.advices.afterReturn, advice);
}
export function afterThrow(context: any, method: string, advice: Function): Function {
	const runner = getAdviceRunner(context, method);
	runner.advices.afterThrow.push(advice);

	return () => removeAdvice(runner.advices.afterThrow, advice);
}
export function after(context: any, method: string, advice: Function): Function {
	const afterReturnAdvice = afterReturn(context, method, advice);
	const afterThrowAdvice = afterThrow(context, method, advice);

	return () => afterReturnAdvice() && afterThrowAdvice();
}
