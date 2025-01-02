import { ReactElement } from 'react';

interface AccessibilityIssue {
  component: string;
  severity: 'error' | 'warning';
  message: string;
  fix?: string;
}

export function checkAccessibility(component: ReactElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for required ARIA attributes and roles
  function checkNode(node: any, parentComponent: string) {
    if (!node || !node.props) return;

    // Check buttons and links
    if (node.type === 'button' || node.type === 'a') {
      if (!node.props['aria-label'] && !node.props.children) {
        issues.push({
          component: parentComponent,
          severity: 'error',
          message: `${node.type} element without accessible name`,
          fix: 'Add aria-label or visible text content'
        });
      }
    }

    // Check images
    if (node.type === 'img' && !node.props.alt) {
      issues.push({
        component: parentComponent,
        severity: 'error',
        message: 'Image without alt text',
        fix: 'Add alt attribute with descriptive text'
      });
    }

    // Check form inputs
    if (node.type === 'input' || node.type === 'select' || node.type === 'textarea') {
      if (!node.props['aria-label'] && !node.props['aria-labelledby']) {
        issues.push({
          component: parentComponent,
          severity: 'error',
          message: `Form control without label`,
          fix: 'Add aria-label or associate with a label element'
        });
      }
    }

    // Check headings order
    if (node.type?.match(/^h[1-6]$/)) {
      const level = parseInt(node.type[1]);
      if (level > 1 && !node.props['aria-level']) {
        issues.push({
          component: parentComponent,
          severity: 'warning',
          message: `Check heading level hierarchy`,
          fix: 'Ensure heading levels are sequential'
        });
      }
    }

    // Check interactive elements
    if (node.props.onClick && node.type !== 'button' && node.type !== 'a') {
      if (!node.props.role && !node.props.tabIndex) {
        issues.push({
          component: parentComponent,
          severity: 'error',
          message: 'Interactive element without keyboard access',
          fix: 'Add role and tabIndex or use a button/link element'
        });
      }
    }

    // Check dialog components
    if (node.type?.displayName?.includes('Dialog')) {
      if (!node.props['aria-label'] && !node.props['aria-labelledby']) {
        issues.push({
          component: parentComponent,
          severity: 'error',
          message: 'Dialog without accessible name',
          fix: 'Add aria-label or aria-labelledby'
        });
      }
    }

    // Recursively check children
    if (node.props.children) {
      if (Array.isArray(node.props.children)) {
        node.props.children.forEach((child: any) => checkNode(child, parentComponent));
      } else {
        checkNode(node.props.children, parentComponent);
      }
    }
  }

  checkNode(component, component.type.name || 'Unknown');
  return issues;
}

// Helper function to log accessibility issues
export function logAccessibilityIssues(component: ReactElement) {
  const issues = checkAccessibility(component);
  
  if (issues.length === 0) {
    console.log('✅ No accessibility issues found');
    return;
  }

  console.group('⚠️ Accessibility Issues Found');
  issues.forEach(issue => {
    const color = issue.severity === 'error' ? '\x1b[31m' : '\x1b[33m';
    console.log(
      `${color}[${issue.severity.toUpperCase()}]\x1b[0m ${issue.component}: ${issue.message}`
    );
    if (issue.fix) {
      console.log(`   Fix: ${issue.fix}`);
    }
  });
  console.groupEnd();
}
