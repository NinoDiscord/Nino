import ArgumentParser from './ArgumentParser';

describe('ArgumentParser', () => {
  let instance: ArgumentParser;

  beforeAll(() => {
    instance = new ArgumentParser([
      'first',
      'second',
      'third',
      '--flagkey',
      '=',
      'flagvalue',
    ]);
  });

  it('it should have three arguments', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    expect(instance.has(0)).toBeTruthy();
    expect(instance.has(1)).toBeTruthy();
    expect(instance.has(2)).toBeTruthy();
    expect(instance.has(3)).toBeFalsy();
  });

  it('it should get the first argument', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    const first = instance.get(0);
    expect(first).toBeDefined();
    expect(first).toBe('first');
  });

  it('it should get the second argument', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    const second = instance.get(1);
    expect(second).toBeDefined();
    expect(second).toBe('second');
  });

  it('it should get the third argument', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    const third = instance.get(2);
    expect(third).toBeDefined();
    expect(third).toBe('third');
  });

  it('it should slice the first two arguments', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    const slice = instance.slice(0, 2);
    expect(slice).toBeDefined();
    expect(slice).toHaveLength(2);
    expect(slice[0]).toBe('first');
    expect(slice[1]).toBe('second');
  });

  it('it should slice the last two arguments', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    const slice = instance.slice(1);
    expect(slice).toBeDefined();
    expect(slice).toHaveLength(2);
    expect(slice[0]).toBe('second');
    expect(slice[1]).toBe('third');
  });

  it('it should join the arguments into one string seperated by space', () => {
    expect(instance).toBeInstanceOf(ArgumentParser);
    const joint = instance.join(' ');
    expect(joint).toBe('first second third');
  });
});
