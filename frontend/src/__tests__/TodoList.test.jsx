import { render, screen, fireEvent } from '@testing-library/react' // เพิ่ม fireEvent
import { vi } from 'vitest'
import App from '../App.jsx'
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: vi.fn(),
}));

// ย้ายตัวแปรที่ใช้ร่วมกันมาไว้ข้างนอก describe เพื่อความสะอาด
const todoItem1 = { id: 1, title: 'First todo', done: false, comments: [] };
const todoItem2 = { id: 2, title: 'Second todo', done: false, comments: [
  { id: 1, message: 'First comment' },
  { id: 2, message: 'Second comment' },
] };
const originalTodoList = [todoItem1, todoItem2];

const mockResponse = (body, ok = true) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
});

describe('App & TodoList Integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    useAuth.mockReturnValue({
      username: 'testuser',
      accessToken: 'fake-token-123', // เพิ่ม Token
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders correctly', async () => {
    global.fetch.mockImplementationOnce(() => mockResponse(originalTodoList));

    render(<App />);

    expect(await screen.findByText('First todo')).toBeInTheDocument();
    expect(await screen.findByText('Second todo')).toBeInTheDocument();
    expect(await screen.findByText('First comment')).toBeInTheDocument();
  });

  it('toggles done on a todo item', async () => {
    const toggledTodoItem1 = { ...todoItem1, done: true };

    global.fetch
      .mockImplementationOnce(() => mockResponse(originalTodoList))    
      .mockImplementationOnce(() => mockResponse(toggledTodoItem1));

    render(<App />);

    const todoText = await screen.findByText('First todo');
    expect(todoText).not.toHaveClass('done');

    const toggleButtons = await screen.findAllByRole('button', { name: /toggle/i });
    
    // ใช้ fireEvent จะได้ผลที่แน่นอนกว่าในบาง Environment
    fireEvent.click(toggleButtons[0]);

    // findByText จะรอจนกว่า State จะอัปเดต (เหมาะกับ async fetch)
    expect(await screen.findByText('First todo')).toHaveClass('done');
  });
});
