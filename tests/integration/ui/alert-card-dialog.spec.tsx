import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

describe('Alert', () => {
  it('renders with default variant and children', () => {
    render(<Alert>Alert content</Alert>);
    expect(screen.getByText('Alert content')).toBeInTheDocument();
  });

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Destructive alert</Alert>);
    expect(screen.getByText('Destructive alert')).toBeInTheDocument();
  });

  it('renders AlertTitle and AlertDescription composition', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description text</AlertDescription>
      </Alert>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('renders Card with children', () => {
    render(<Card><p>Card body</p></Card>);
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('renders CardHeader with CardTitle and CardDescription', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description text')).toBeInTheDocument();
  });

  it('renders CardContent and CardFooter', () => {
    render(
      <Card>
        <CardContent>Content area</CardContent>
        <CardFooter>Footer area</CardFooter>
      </Card>
    );
    expect(screen.getByText('Content area')).toBeInTheDocument();
    expect(screen.getByText('Footer area')).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('renders DialogContent with children when open', () => {
    render(<Dialog open><DialogContent>Dialog body</DialogContent></Dialog>);
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('renders DialogHeader with DialogTitle and DialogDescription', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog description')).toBeInTheDocument();
  });
});

describe('Progress', () => {
  it('renders with 0% value', () => {
    render(<Progress value={0} />);
    const indicator = document.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toBeInTheDocument();
  });

  it('renders with 50% value', () => {
    render(<Progress value={50} />);
    expect(document.querySelector('[data-slot="progress-indicator"]')).toBeInTheDocument();
  });

  it('renders with 100% value', () => {
    render(<Progress value={100} />);
    expect(document.querySelector('[data-slot="progress-indicator"]')).toBeInTheDocument();
  });
});

describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
});
