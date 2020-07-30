import * as util from '.';


describe('Utilities', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('should return "5s" as the time', () => {
    const time = util.humanize(5000);
    
    expect(time).toBeDefined();
    expect(time).toStrictEqual('5s');
  });

  it('should return "5 seconds" as the time', () => {
    const time = util.humanize(5000, true);

    expect(time).toBeDefined();
    expect(time).toStrictEqual('5 seconds');
  });

  it('should return "229.5KB" as the size', () => {
    const size = util.formatSize(235000);

    expect(size).toBeDefined();
    expect(size).toStrictEqual('229.5KB');
  });

  it('should return an unembedified version', () => {
    const embed = util.unembedify({
      title: 'abcd ur gay',
      description: 'derpy is a bitchass motherfucker. he pissed on my god damn wife.',
      footer: {
        text: 'this is my callout post on twitter.com to say that derpy has a small, quilly dick'
      },
      fields: [
        {
          name: 'dick',
          value: 'he has a quilly ass dick'
        }
      ]
    });

    const strings = [
      '__**abcd ur gay**__',
      '> **derpy is a bitchass motherfucker. he pissed on my god damn wife.**',
      '',
      '- dick: he has a quilly ass dick',
      '',
      '**this is my callout post on twitter.com to say that derpy has a small, quilly dick**'
    ];

    expect(embed).toBeDefined();
    expect(embed).toStrictEqual(strings.join('\n'));
  });

  it('should test bigTimeout with a 1 minute timeout', () => {
    const MINUTE = 60000;
    const callback = jest.fn(); // Creates a mock function

    util.bigTimeout(callback, MINUTE);
    expect(callback).not.toBeCalled();

    jest.advanceTimersByTime(60000);
    expect(callback).toBeCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should test bigTimeout with a 1 year timeout', () => {
    const YEAR = 31557600000;
    let temp = YEAR;
    const callback = jest.fn();
  
    util.bigTimeout(callback, YEAR);
    expect(callback).not.toBeCalled();

    let i = 0;
    while (temp > 0x7fffffff) {
      jest.advanceTimersByTime(0x7fffffff);
      temp -= 0x7fffffff;
      i++;
    }
    jest.runOnlyPendingTimers();

    expect(i).toBe(Math.floor(YEAR / 0x7fffffff));
    expect(jest.getTimerCount()).toBe(0);
    expect(0x7fffffff*i + temp).toBe(YEAR);
    expect(callback).toBeCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});